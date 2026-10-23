import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
        payments: true,
        serialNumbers: true,
        businessProfile: true,
        revisions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: invoice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/invoices/[id]
 * Soft delete invoice: moves to Recently Deleted (7-day recovery).
 * Safely restores inventory for physical products and decrements customer balance.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // json body optional
    }

    const reason = body.reason?.trim() || 'Moved to Recently Deleted';
    const deletedBy = auth.user.username;

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        serialNumbers: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.isDeleted) {
      return NextResponse.json({ success: false, error: 'Invoice is already in Recently Deleted' }, { status: 400 });
    }

    const previousSnapshot = JSON.stringify(invoice);

    const deleted = await db.$transaction(async (tx) => {
      // 1. If invoice was Confirmed and NOT a Quotation, restore physical stock and serials
      if (invoice.status === 'Confirmed' && invoice.invoiceType !== 'QUOTATION') {
        for (const it of invoice.items) {
          const isService = it.product?.productType === 'SERVICE' || it.product?.category?.toLowerCase() === 'service';
          if (!isService && it.productId) {
            const updatedProd = await tx.product.update({
              where: { id: it.productId },
              data: { currentStock: { increment: it.quantity } },
            });

            await tx.stockMovement.create({
              data: {
                productId: it.productId,
                type: 'RETURN_CUSTOMER',
                referenceType: 'INVOICE_DELETED',
                referenceId: invoice.id,
                referenceNumber: invoice.invoiceNumber,
                quantityChange: it.quantity,
                balanceAfter: updatedProd.currentStock,
                unitPrice: it.rate,
                notes: `Stock restored upon soft-deleting Invoice ${invoice.invoiceNumber}`,
              },
            });
          }
        }

        // Restore serial numbers
        for (const sn of invoice.serialNumbers) {
          await tx.serialNumber.update({
            where: { id: sn.id },
            data: {
              status: 'In Stock',
              salesInvoiceId: null,
              customerId: null,
              saleDate: null,
              warrantyStart: null,
              warrantyEnd: null,
            },
          });
        }

        // Deduct customer unpaid balance
        if (invoice.balanceDue > 0) {
          await tx.customer.update({
            where: { id: invoice.customerId },
            data: { currentBalance: { decrement: invoice.balanceDue } },
          });
        }
      }

      // 2. Mark invoice soft-deleted with timestamp and audit info
      const now = new Date();
      const updated = await tx.invoice.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: now,
          deletedBy,
          deletionReason: reason,
        },
      });

      // 3. Record audit trail
      await tx.invoiceRevisionAudit.create({
        data: {
          invoiceId: id,
          revisionNumber: invoice.revisionNumber,
          action: 'SOFT_DELETED',
          changedBy: deletedBy,
          changeReason: reason,
          diffSummary: JSON.stringify([
            { field: 'Status', oldVal: 'Active', newVal: 'Recently Deleted (7-day recovery)' },
            { field: 'Deletion Reason', oldVal: '-', newVal: reason },
          ]),
          previousSnapshot,
          newSnapshot: JSON.stringify(updated),
        },
      });

      return updated;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    return NextResponse.json({
      success: true,
      message: 'Invoice moved to Recently Deleted. It can be recovered for 7 days.',
      data: deleted,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/invoices/[id]
 * Full audited invoice edit with stock reconciliation and diff logging.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const body = await request.json();
    const {
      customerId,
      date,
      dueDate,
      invoiceType,
      taxConfiguration,
      items,
      subtotal,
      discountPercent,
      discountAmount,
      taxableAmount,
      cgst,
      sgst,
      igst,
      grandTotal,
      paidAmount,
      paymentMode,
      notes,
      terms,
      revisionReason,
    } = body;
    const changedBy = auth.user.username;

    if (!revisionReason || !revisionReason.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'A revision reason is mandatory to edit an invoice for audit compliance.',
        },
        { status: 400 }
      );
    }

    const existingInvoice = await db.invoice.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        serialNumbers: true,
        customer: true,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (existingInvoice.isDeleted) {
      return NextResponse.json(
        { success: false, error: 'Cannot edit an invoice that is in Recently Deleted. Please restore it first.' },
        { status: 400 }
      );
    }

    const previousSnapshot = JSON.stringify(existingInvoice);
    const nextRevision = (existingInvoice.revisionNumber || 1) + 1;
    const invDate = date ? new Date(date) : existingInvoice.date;

    const editedInvoice = await db.$transaction(async (tx) => {
      // 1. Fetch new customer if changed
      let newCustomerSnapshot = existingInvoice.customerSnapshot;
      const targetCustomerId = customerId || existingInvoice.customerId;
      if (customerId && customerId !== existingInvoice.customerId) {
        const cust = await tx.customer.findUnique({ where: { id: customerId } });
        if (cust) {
          newCustomerSnapshot = JSON.stringify({
            id: cust.id,
            name: cust.name,
            phone: cust.phone,
            email: cust.email,
            address: cust.address,
            gstin: cust.gstin,
            state: cust.state,
            stateCode: cust.stateCode,
          });
        }
      }

      const targetInvoiceType = invoiceType || existingInvoice.invoiceType || 'NON_GST';
      const targetTaxConfig = taxConfiguration || existingInvoice.taxConfiguration || 'NONE';

      // 2. Reconcile physical inventory and serial numbers
      if (Array.isArray(items) && items.length > 0) {
        // Build map of old item quantities by productId (only if old invoice was NOT a Quotation)
        const oldPhysicalQtys = new Map<string, number>();
        if (existingInvoice.invoiceType !== 'QUOTATION') {
          for (const oldIt of existingInvoice.items) {
            const isService = oldIt.product?.productType === 'SERVICE' || oldIt.product?.category?.toLowerCase() === 'service';
            if (!isService && oldIt.productId) {
              oldPhysicalQtys.set(oldIt.productId, (oldPhysicalQtys.get(oldIt.productId) || 0) + oldIt.quantity);
            }
          }
        }

        // Fetch product records for new items to check productType
        const newProductIds = items.map((it: any) => it.productId).filter(Boolean);
        const productRecords = await tx.product.findMany({
          where: { id: { in: newProductIds } },
        });
        const productMap = new Map(productRecords.map((p) => [p.id, p]));

        // Build map of new physical item quantities (only if target invoice is NOT a Quotation)
        const newPhysicalQtys = new Map<string, number>();
        if (targetInvoiceType !== 'QUOTATION') {
          for (const newIt of items) {
            const prod = productMap.get(newIt.productId);
            const isService = prod?.productType === 'SERVICE' || prod?.category?.toLowerCase() === 'service';
            if (!isService && newIt.productId) {
              const qty = parseInt(newIt.quantity) || 1;
              newPhysicalQtys.set(newIt.productId, (newPhysicalQtys.get(newIt.productId) || 0) + qty);
            }
          }
        }

        // All product IDs involved
        const allProductIds = new Set([...oldPhysicalQtys.keys(), ...newPhysicalQtys.keys()]);
        for (const prodId of allProductIds) {
          const oldQty = oldPhysicalQtys.get(prodId) || 0;
          const newQty = newPhysicalQtys.get(prodId) || 0;
          const diff = newQty - oldQty; // if > 0: need to decrement more; if < 0: return stock

          if (diff > 0) {
            // Sold more units
            const updated = await tx.product.update({
              where: { id: prodId },
              data: { currentStock: { decrement: diff } },
            });
            await tx.stockMovement.create({
              data: {
                productId: prodId,
                date: invDate,
                type: 'SALE',
                referenceType: 'INVOICE_EDIT',
                referenceId: existingInvoice.id,
                referenceNumber: existingInvoice.invoiceNumber,
                quantityChange: -diff,
                balanceAfter: updated.currentStock,
                notes: `Stock reduced by ${diff} on Invoice ${existingInvoice.invoiceNumber} edit`,
              },
            });
          } else if (diff < 0) {
            // Returned units to stock
            const returnQty = Math.abs(diff);
            const updated = await tx.product.update({
              where: { id: prodId },
              data: { currentStock: { increment: returnQty } },
            });
            await tx.stockMovement.create({
              data: {
                productId: prodId,
                date: invDate,
                type: 'RETURN_CUSTOMER',
                referenceType: 'INVOICE_EDIT',
                referenceId: existingInvoice.id,
                referenceNumber: existingInvoice.invoiceNumber,
                quantityChange: returnQty,
                balanceAfter: updated.currentStock,
                notes: `Stock returned by ${returnQty} on Invoice ${existingInvoice.invoiceNumber} edit`,
              },
            });
          }
        }

        // Delete old items and insert updated items
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

        await tx.invoiceItem.createMany({
          data: items.map((it: any) => {
            const prod = productMap.get(it.productId);
            const prodName = prod?.name || it.description || 'Item';
            const warranty = prod?.warranty || it.warranty || '6 Months';
            const rate = parseFloat(it.rate) || 0;
            const disc = parseFloat(it.discount) || 0;
            const gstPct = it.gstPercent !== undefined ? parseFloat(it.gstPercent) : 0;
            const taxable = parseFloat(it.taxableAmount) || 0;
            const gst = parseFloat(it.gstAmount) || 0;
            const itemTotal = parseFloat(it.total) || 0;
            const hsn = it.hsn || prod?.hsn || '8471';
            const qty = parseInt(it.quantity) || 1;
            const unit = it.unit || 'Pcs';

            return {
              invoiceId: id,
              productId: it.productId,
              productName: prodName,
              warranty,
              serialNumber: it.serialNumber || null,
              description: it.description || prodName || null,
              hsn,
              quantity: qty,
              unit,
              rate,
              discount: disc,
              gstPercent: gstPct,
              taxableAmount: taxable,
              gstAmount: gst,
              total: itemTotal,
              itemSnapshot: JSON.stringify({
                productId: it.productId,
                productName: prodName,
                brand: prod?.brand,
                model: prod?.model,
                hsn,
                warranty,
                serialNumber: it.serialNumber || null,
                quantity: qty,
                unit,
                rate,
                discount: disc,
                gstPercent: gstPct,
                taxableAmount: taxable,
                gstAmount: gst,
                total: itemTotal,
              }),
            };
          }),
        });
      }

      // 3. Recalculate financial totals
      const newGrandTotal = grandTotal !== undefined ? parseFloat(grandTotal) : existingInvoice.grandTotal;
      const newPaidAmount = paidAmount !== undefined ? parseFloat(paidAmount) : existingInvoice.paidAmount;
      const newBalanceDue = Math.max(0, newGrandTotal - newPaidAmount);
      let newPaymentStatus = 'Paid';
      if (newPaidAmount <= 0) newPaymentStatus = 'Unpaid';
      else if (newPaidAmount < newGrandTotal) newPaymentStatus = 'Partial';

      // Reconcile customer outstanding balance
      const effectiveOldDue = existingInvoice.invoiceType === 'QUOTATION' ? 0 : existingInvoice.balanceDue;
      const effectiveNewDue = targetInvoiceType === 'QUOTATION' ? 0 : newBalanceDue;
      const balanceDifference = effectiveNewDue - effectiveOldDue;
      if (balanceDifference !== 0) {
        await tx.customer.update({
          where: { id: targetCustomerId },
          data: { currentBalance: { increment: balanceDifference } },
        });
      }

      // 4. Update the invoice record
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          customerId: targetCustomerId,
          date: invDate,
          dueDate: dueDate ? new Date(dueDate) : existingInvoice.dueDate,
          subtotal: subtotal !== undefined ? parseFloat(subtotal) : existingInvoice.subtotal,
          discountPercent: discountPercent !== undefined ? parseFloat(discountPercent) : existingInvoice.discountPercent,
          discountAmount: discountAmount !== undefined ? parseFloat(discountAmount) : existingInvoice.discountAmount,
          taxableAmount: taxableAmount !== undefined ? parseFloat(taxableAmount) : existingInvoice.taxableAmount,
          cgst: cgst !== undefined ? parseFloat(cgst) : existingInvoice.cgst,
          sgst: sgst !== undefined ? parseFloat(sgst) : existingInvoice.sgst,
          igst: igst !== undefined ? parseFloat(igst) : existingInvoice.igst,
          grandTotal: newGrandTotal,
          finalTotal: newGrandTotal,
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
          paymentStatus: newPaymentStatus,
          paymentMode: paymentMode || existingInvoice.paymentMode,
          notes: notes !== undefined ? notes : existingInvoice.notes,
          terms: terms !== undefined ? terms : existingInvoice.terms,
          invoiceType: targetInvoiceType,
          taxConfiguration: targetTaxConfig,
          revisionNumber: nextRevision,
          revisionReason: revisionReason.trim(),
          customerSnapshot: newCustomerSnapshot,
        },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });

      // 5. Generate structured before/after diff summary
      const diffSummaryList: { field: string; oldVal: string; newVal: string }[] = [];
      
      // Customer diff
      let oldCustObj: any = existingInvoice.customer;
      if (existingInvoice.customerSnapshot) {
        try {
          oldCustObj = typeof existingInvoice.customerSnapshot === 'string'
            ? JSON.parse(existingInvoice.customerSnapshot)
            : existingInvoice.customerSnapshot;
        } catch {}
      }
      const newCustObj = updatedInvoice.customer;
      if (newCustObj && oldCustObj?.phone !== newCustObj.phone) {
        diffSummaryList.push({
          field: 'Customer Phone',
          oldVal: oldCustObj?.phone || '-',
          newVal: newCustObj.phone || '-',
        });
      }
      if (existingInvoice.customerId !== targetCustomerId) {
        diffSummaryList.push({
          field: 'Customer Name',
          oldVal: existingInvoice.customer?.name || 'Previous Customer',
          newVal: updatedInvoice.customer?.name || 'New Customer',
        });
      }

      // Date diff
      if (new Date(existingInvoice.date).toISOString().split('T')[0] !== invDate.toISOString().split('T')[0]) {
        diffSummaryList.push({
          field: 'Invoice Date',
          oldVal: new Date(existingInvoice.date).toLocaleDateString('en-IN'),
          newVal: invDate.toLocaleDateString('en-IN'),
        });
      }

      // Invoice Type diff
      if (targetInvoiceType !== (existingInvoice.invoiceType || 'TAX_INVOICE')) {
        diffSummaryList.push({
          field: 'Invoice Type',
          oldVal: existingInvoice.invoiceType || 'TAX_INVOICE',
          newVal: targetInvoiceType,
        });
      }

      // Tax Configuration diff
      if (targetTaxConfig !== (existingInvoice.taxConfiguration || 'CGST_SGST')) {
        diffSummaryList.push({
          field: 'Tax Configuration',
          oldVal: existingInvoice.taxConfiguration || 'CGST_SGST',
          newVal: targetTaxConfig,
        });
      }

      // Item level selling price, quantity, and discount diffs
      if (existingInvoice.items.length === 1 && updatedInvoice.items.length === 1) {
        const oldIt = existingInvoice.items[0];
        const newIt = updatedInvoice.items[0];
        if (oldIt.rate !== newIt.rate) {
          diffSummaryList.push({
            field: 'Selling Price',
            oldVal: `₹${oldIt.rate.toLocaleString('en-IN')}`,
            newVal: `₹${newIt.rate.toLocaleString('en-IN')}`,
          });
        }
        if (oldIt.discount !== newIt.discount) {
          diffSummaryList.push({
            field: 'Discount',
            oldVal: `₹${oldIt.discount.toLocaleString('en-IN')}`,
            newVal: `₹${newIt.discount.toLocaleString('en-IN')}`,
          });
        }
        if (oldIt.quantity !== newIt.quantity) {
          diffSummaryList.push({
            field: 'Quantity',
            oldVal: `${oldIt.quantity}`,
            newVal: `${newIt.quantity}`,
          });
        }
      } else {
        // Multi-item diffing: track modifications, additions, and removals
        updatedInvoice.items.forEach((newIt, idx) => {
          const oldIt = existingInvoice.items[idx];
          const name = newIt.productName || newIt.description || `Item #${idx + 1}`;
          if (oldIt) {
            if (oldIt.rate !== newIt.rate) {
              diffSummaryList.push({
                field: `Selling Price (${name})`,
                oldVal: `₹${oldIt.rate.toLocaleString('en-IN')}`,
                newVal: `₹${newIt.rate.toLocaleString('en-IN')}`,
              });
            }
            if (oldIt.quantity !== newIt.quantity) {
              diffSummaryList.push({
                field: `Quantity (${name})`,
                oldVal: `${oldIt.quantity}`,
                newVal: `${newIt.quantity}`,
              });
            }
            if (oldIt.discount !== newIt.discount) {
              diffSummaryList.push({
                field: `Discount (${name})`,
                oldVal: `₹${oldIt.discount.toLocaleString('en-IN')}`,
                newVal: `₹${newIt.discount.toLocaleString('en-IN')}`,
              });
            }
          } else {
            diffSummaryList.push({
              field: 'Item Added',
              oldVal: '-',
              newVal: `${name} (Qty: ${newIt.quantity}, Rate: ₹${newIt.rate.toLocaleString('en-IN')})`,
            });
          }
        });

        if (existingInvoice.items.length > updatedInvoice.items.length) {
          for (let i = updatedInvoice.items.length; i < existingInvoice.items.length; i++) {
            const removed = existingInvoice.items[i];
            diffSummaryList.push({
              field: 'Item Removed',
              oldVal: removed.productName || removed.description || `Item #${i + 1}`,
              newVal: '-',
            });
          }
        }
      }

      if (discountAmount !== undefined && existingInvoice.discountAmount !== parseFloat(discountAmount)) {
        diffSummaryList.push({
          field: 'Discount Amount',
          oldVal: `₹${existingInvoice.discountAmount.toLocaleString('en-IN')}`,
          newVal: `₹${parseFloat(discountAmount).toLocaleString('en-IN')}`,
        });
      }

      // Grand total diff
      if (existingInvoice.grandTotal !== newGrandTotal) {
        diffSummaryList.push({
          field: 'Grand Total',
          oldVal: `₹${existingInvoice.grandTotal.toLocaleString('en-IN')}`,
          newVal: `₹${newGrandTotal.toLocaleString('en-IN')}`,
        });
      }

      // Payment diffs
      if (existingInvoice.paymentMode !== updatedInvoice.paymentMode) {
        diffSummaryList.push({
          field: 'Payment Mode',
          oldVal: existingInvoice.paymentMode,
          newVal: updatedInvoice.paymentMode,
        });
      }
      if (existingInvoice.paidAmount !== newPaidAmount) {
        diffSummaryList.push({
          field: 'Paid Amount',
          oldVal: `₹${existingInvoice.paidAmount.toLocaleString('en-IN')}`,
          newVal: `₹${newPaidAmount.toLocaleString('en-IN')}`,
        });
      }
      if (existingInvoice.balanceDue !== newBalanceDue) {
        diffSummaryList.push({
          field: 'Balance Due',
          oldVal: `₹${existingInvoice.balanceDue.toLocaleString('en-IN')}`,
          newVal: `₹${newBalanceDue.toLocaleString('en-IN')}`,
        });
      }
      if (existingInvoice.items.length !== updatedInvoice.items.length) {
        diffSummaryList.push({
          field: 'Items Count',
          oldVal: `${existingInvoice.items.length} items`,
          newVal: `${updatedInvoice.items.length} items`,
        });
      }

      // Record audit entry
      await tx.invoiceRevisionAudit.create({
        data: {
          invoiceId: id,
          revisionNumber: nextRevision,
          action: 'EDITED',
          changedBy,
          changeReason: revisionReason.trim(),
          diffSummary: JSON.stringify(diffSummaryList),
          previousSnapshot,
          newSnapshot: JSON.stringify(updatedInvoice),
        },
      });

      return updatedInvoice;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    return NextResponse.json({ success: true, data: editedInvoice });
  } catch (error: any) {
    console.error('Invoice Edit Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
