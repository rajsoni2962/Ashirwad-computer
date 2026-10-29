'use client';

import React, { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Wrench,
  Cpu,
  Laptop,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  MapPin,
  Mail,
  ChevronRight,
  ChevronDown,
  Search,
  Check,
  Copy,
  ExternalLink,
  ArrowRight,
  Star,
  Layers,
  Sparkles,
  Zap,
  Activity,
  Award,
  Lock,
  Headphones,
  Monitor,
  Menu,
  X,
  Send,
  HelpCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ProductItem {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  cpu: string | null;
  ram: string | null;
  storage: string | null;
  sellingPrice: number;
  currentStock: number;
  description: string | null;
}

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live Products State
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [productsLoading, setProductsLoading] = useState(true);

  // Serial Warranty Lookup State
  const [serialQuery, setSerialQuery] = useState('');
  const [searchingSerial, setSearchingSerial] = useState(false);
  const [serialResult, setSerialResult] = useState<any | null>(null);
  const [serialSearched, setSerialSearched] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState(false);

  // Diagnostic Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    deviceType: 'Laptop',
    brand: '',
    issueCategory: 'Power Issue / Won\'t Turn On',
    description: '',
    locality: 'New Ranip',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Business settings state
  const [settings, setSettings] = useState<any>({
    phone: '9662278994',
    address: 'Ashraya 10, GST compound, new ranip, Ahmedabad 382470.',
    email: 'rajsoni2962@gmail.com',
  });

  useEffect(() => {
    // Fetch live products
    fetchProducts(selectedCategory);

    // Fetch store contact details
    fetch('/api/settings')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setSettings((prev: any) => ({
            ...prev,
            ...json.data,
          }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts(selectedCategory);
  }, [selectedCategory]);

  const fetchProducts = async (cat: string) => {
    setProductsLoading(true);
    try {
      const url = cat && cat !== 'All' ? `/api/products?category=${encodeURIComponent(cat)}` : '/api/products';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProducts(json.data.slice(0, 8));
      }
    } catch (err) {
      console.error('Failed to load inventory products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleSerialSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialQuery.trim()) return;
    setSearchingSerial(true);
    setSerialSearched(true);
    try {
      const res = await fetch(`/api/serial-numbers?search=${encodeURIComponent(serialQuery.trim())}`);
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        setSerialResult(json.data[0]);
      } else {
        setSerialResult(null);
      }
    } catch (err) {
      console.error(err);
      setSerialResult(null);
    } finally {
      setSearchingSerial(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSerial(true);
    setTimeout(() => setCopiedSerial(false), 2000);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate phone number (must be 10 digits)
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number so our technician can reach you.');
      return;
    }

    if (!formData.name.trim()) {
      setFormError('Please provide your name.');
      return;
    }

    if (!formData.description.trim()) {
      setFormError('Please provide a brief description of the issue or requirement.');
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: cleanPhone,
          deviceType: formData.deviceType,
          brand: formData.brand,
          issueDescription: `[${formData.issueCategory}] ${formData.description}`,
          locality: formData.locality,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setFormSuccess(json.data);
      } else {
        setFormError(json.error || 'Failed to submit request. Please WhatsApp or call us directly.');
      }
    } catch {
      setFormError('Network error. Please call or WhatsApp us directly at +91 9662278994.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const servicesList = [
    {
      id: 'laptop-repair',
      icon: Laptop,
      title: 'Laptop & PC Repair',
      desc: 'Expert diagnostic and repair for all major brands: Dell, HP, Lenovo, ASUS, Acer, Apple MacBook, and MSI.',
      points: [
        'No Display & Dim Backlight Repair',
        'Charging Port & Power Jack Replacement',
        'Broken Hinge & Housing Fabrication',
        'Battery Replacement & Internal Servicing'
      ],
      tag: 'Same-Day Diagnostics',
      whatsappText: 'Hello Ashirwad Technologies, I need laptop repair service for my device.',
    },
    {
      id: 'motherboard-repair',
      icon: Cpu,
      title: 'Chip-Level Motherboard Repair',
      desc: 'Precision micro-soldering and microscope-guided troubleshooting that saves up to 70% vs complete board replacement.',
      points: [
        'Short Circuit Tracing & Thermal Analysis',
        'Power IC & Mosfet Replacement',
        'BIOS EEPROM Reprogramming',
        'Liquid & Spill Corrosion Treatment'
      ],
      tag: 'Save Up To 70% Cost',
      whatsappText: 'Hello Ashirwad Technologies, I need chip-level motherboard repair estimation.',
    },
    {
      id: 'upgrades',
      icon: HardDrive,
      title: 'Hardware & Speed Upgrades',
      desc: 'Turn your sluggish laptop or desktop into a lightning-fast workstation with high-speed SSD and RAM expansions.',
      points: [
        'PCIe Gen4 / Gen3 NVMe SSD Upgrades',
        'DDR4 & DDR5 RAM Expansion up to 64GB',
        'High-Conductivity Thermal Paste Repasting',
        'Instant 5x to 10x Performance Boost'
      ],
      tag: 'Instant 10x Speed',
      whatsappText: 'Hello Ashirwad Technologies, I want to upgrade my laptop RAM and SSD.',
    },
    {
      id: 'custom-pc',
      icon: Monitor,
      title: 'Custom PC Builds',
      desc: 'Handcrafted gaming rigs, 4K/8K video editing workstations, architecture CAD setups, and multi-monitor trading PCs.',
      points: [
        'Tailored Component Selection within Budget',
        'Tier-1 Power Supplies & Clean Cable Management',
        'Stress-Tested Thermals & Benchmarking',
        'Genuine Windows & Driver Optimization'
      ],
      tag: 'Zero Bottleneck Guarantee',
      whatsappText: 'Hello Ashirwad Technologies, I am looking to build a custom PC. Can you share a quote?',
    },
    {
      id: 'refurbished',
      icon: ShieldCheck,
      title: 'Certified Refurbished Laptops',
      desc: 'Grade-A enterprise laptops (Dell Latitude, Lenovo ThinkPad, HP EliteBook) rigorously tested with 6 months warranty.',
      points: [
        '100% Bench Tested Hardware Components',
        '6 Months Hardware Warranty Coverage',
        'Original Power Adapters Included',
        'Priced at 60% Below New Retail Cost'
      ],
      tag: '6 Months Warranty',
      whatsappText: 'Hello Ashirwad Technologies, please share your available certified refurbished laptop inventory.',
    },
    {
      id: 'windows-software',
      icon: Zap,
      title: 'Windows Installation & Setup',
      desc: 'Genuine operating system installations, driver configuration, blue screen (BSOD) fixes, and virus eradication.',
      points: [
        'Clean Windows 11 & Windows 10 Setup',
        'Blue Screen (BSOD) & Crash Diagnostics',
        'Driver Tuning & BIOS Firmware Updates',
        'Malware Eradication & Data Protection'
      ],
      tag: 'Safe Data Protection',
      whatsappText: 'Hello Ashirwad Technologies, I need help with Windows installation and OS troubleshooting.',
    },
    {
      id: 'networking-remote',
      icon: Headphones,
      title: 'Networking & Remote IT Support',
      desc: 'Local network setup for offices, dual-band Wi-Fi optimization, and rapid remote troubleshooting via AnyDesk / TeamViewer.',
      points: [
        'Office LAN Cabling & Router Configuration',
        'Wi-Fi Deadzone Elimination & Mesh Setup',
        'Secure Remote Desktop Troubleshooting',
        'Network Printer & File Sharing Setup'
      ],
      tag: 'Remote Assistance',
      whatsappText: 'Hello Ashirwad Technologies, I need networking and IT support assistance.',
    },
    {
      id: 'accessories',
      icon: Layers,
      title: 'Genuine Accessories & Spares',
      desc: 'Top-quality computer peripherals, high-speed cables, original replacement chargers, laptop sleeves, and components.',
      points: [
        'Original Replacement Laptop Chargers',
        'External NVMe SSD Enclosures',
        'Precision Mice, Keyboards & Cooling Pads',
        'DisplayPort, HDMI & Type-C Adapters'
      ],
      tag: 'OEM Quality',
      whatsappText: 'Hello Ashirwad Technologies, I need to purchase computer accessories/chargers.',
    },
  ];

  const faqs = [
    {
      q: 'How long does a typical laptop or PC repair take?',
      a: 'Standard software issues, SSD/RAM upgrades, and battery or screen replacements are often completed within 2 to 4 hours on the same day. In-depth chip-level motherboard repairs typically take 24 to 48 hours for thorough micro-soldering, trace diagnostics, and comprehensive 6-hour thermal stress testing.',
    },
    {
      q: 'Do you provide a warranty on your repairs and refurbished laptops?',
      a: 'Yes! All certified refurbished laptops sold by Ashirwad Technologies come with our comprehensive 6 Months Hardware Warranty. Chip-level motherboard repairs and hardware component replacements also carry genuine warranty coverage against technical defects.',
    },
    {
      q: 'Will my personal and business data remain safe during repair?',
      a: 'Absolutely. We treat customer data confidentiality with the highest priority. Your storage drives are never formatted without your explicit prior authorization, and our technicians do not access your personal photos, files, or sensitive information. Where required, we can also perform backups before servicing.',
    },
    {
      q: 'Why should I repair my motherboard instead of replacing it?',
      a: 'Brand service centers frequently quote ₹12,000 to ₹25,000 to replace an entire motherboard for a simple shorted capacitor, damaged power IC, or blown mosfet. Our chip-level micro-soldering resolves the exact faulty component at the microscopic level, restoring 100% factory functionality while saving you up to 70% of the cost.',
    },
    {
      q: 'Can you help me design and assemble a custom PC within my specific budget?',
      a: 'Yes! We specialize in custom gaming PCs, video editing workstations, architecture/CAD rigs, and day-trading setups. We help you choose the best price-to-performance balance across CPU, GPU, motherboard, high-airflow chassis, and tier-1 power supplies to eliminate bottlenecks.',
    },
    {
      q: 'Do you offer doorstep pickup and drop in Ahmedabad?',
      a: 'Yes, we provide doorstep pickup and delivery across New Ranip, Ranip, Chandkheda, Sabarmati, Motera, Gota, Ghatlodiya, SG Highway, and surrounding Ahmedabad areas for laptops and desktops. You can also visit our workshop directly in New Ranip for immediate bench inspection.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. TOP ANNOUNCEMENT / QUICK CONTACT BAR */}
      <div className="bg-[#0B132B] text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">
              Workshop in New Ranip, Ahmedabad • Doorstep Pickup & Fast Diagnostics
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="hidden md:inline text-slate-400">
              Hours: Mon–Sat 10:00 AM – 8:30 PM
            </span>
            <a
              href="tel:+919662278994"
              className="font-bold text-white hover:text-blue-400 flex items-center gap-1 transition"
            >
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>+91 9662278994</span>
            </a>
            <a
              href="https://wa.me/919662278994?text=Hello%20Ashirwad%20Technologies,%20I%20have%20an%20inquiry."
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Us</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. STICKY MAIN NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <Link href="/" className="flex items-center gap-3.5 group shrink-0">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-white p-1 group-hover:border-blue-500 transition">
              <img
                src="/brand/logo.png"
                alt="Ashirwad Technologies Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black tracking-tight text-[#0B132B] flex items-center gap-1.5 leading-none">
                <span>ASHIRWAD</span>
                <span className="text-blue-600">TECHNOLOGIES</span>
              </div>
              <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mt-1">
                Beyond Tech Limits...
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <a href="#services" className="hover:text-blue-600 transition">Services</a>
            <a href="#diagnostic-form" className="hover:text-blue-600 transition">Get Diagnosis</a>
            <a href="#inventory" className="hover:text-blue-600 transition">Refurbished Laptops</a>
            <a href="#custom-builds" className="hover:text-blue-600 transition">Custom PCs</a>
            <a href="#process" className="hover:text-blue-600 transition">Repair Process</a>
            <a href="#warranty-check" className="hover:text-blue-600 transition">Warranty Check</a>
            <a href="#faq" className="hover:text-blue-600 transition">FAQ</a>
            <a href="#contact" className="hover:text-blue-600 transition">Contact</a>
          </nav>

          {/* Right Header CTAs */}
          <div className="flex items-center gap-2.5">
            <a
              href="https://wa.me/919662278994?text=Hello%20Ashirwad%20Technologies,%20I%20would%20like%20to%20get%20a%20quote%20for%20laptop/PC%20service."
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Quote</span>
            </a>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 transition"
              title="Staff & ERP Management Portal"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Staff Portal</span>
            </Link>

            {/* Mobile menu trigger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-5 py-4 space-y-3 shadow-lg animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-800">
              <a
                href="#services"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-800"
              >
                Services
              </a>
              <a
                href="#diagnostic-form"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-800"
              >
                Book Free Diagnosis
              </a>
              <a
                href="#inventory"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-800"
              >
                Refurbished Laptops & Stock
              </a>
              <a
                href="#custom-builds"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-800"
              >
                Custom PC Builds
              </a>
              <a
                href="#process"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-800"
              >
                Our 5-Step Repair Process
              </a>
              <a
                href="#warranty-check"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-800"
              >
                Hardware Warranty Lookup
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-800"
              >
                FAQ
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-800"
              >
                Store Details & Map
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <a
                href="https://wa.me/919662278994?text=Hello%20Ashirwad%20Technologies,%20I%20have%20an%20inquiry."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
              <a
                href="tel:+919662278994"
                className="w-full py-2.5 px-4 bg-[#0B132B] hover:bg-slate-800 text-white font-bold text-center text-sm rounded-xl flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-blue-400" />
                <span>Call +91 9662278994</span>
              </a>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 px-4 text-center text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                🔒 Staff ERP Portal Login
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-slate-100/70 via-white to-slate-50 border-b border-slate-200">
        {/* Subtle geometric pattern accent */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-sky-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>Ahmedabad’s Certified Hardware Specialists • New Ranip</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-[#0B132B] tracking-tight leading-[1.15]">
                Precision Laptop Repair, Custom Builds & Certified Hardware
              </h1>

              {/* Tagline & Description */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl">
                Microscope-guided chip-level motherboard repair, high-speed SSD/RAM upgrades, custom high-performance gaming rigs, and certified refurbished business laptops with genuine <strong className="text-slate-900 font-semibold">6-month warranty</strong>.
              </p>

              {/* Value Highlights Pill Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800">6 Months Warranty</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800">Chip-Level Repair</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800">100% Bench Tested</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
                <a
                  href="https://wa.me/919662278994?text=Hello%20Ashirwad%20Technologies,%20I%20need%20a%20repair%20quote%20for%20my%20laptop/PC."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2.5"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Instant WhatsApp Quote</span>
                </a>

                <a
                  href="#diagnostic-form"
                  className="px-6 py-4 rounded-xl bg-[#0B132B] hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Wrench className="w-4 h-4 text-blue-400" />
                  <span>Book Free Diagnosis</span>
                </a>

                <a
                  href="tel:+919662278994"
                  className="px-5 py-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm border border-slate-300 transition flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 text-slate-600" />
                  <span>+91 9662278994</span>
                </a>
              </div>
            </div>

            {/* Right Card / Visual Showcase */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                      AT
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Hardware Lab
                      </div>
                      <div className="text-sm font-black text-[#0B132B]">
                        Ashirwad Diagnostic Center
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Active Bench
                  </span>
                </div>

                {/* Quick Diagnostics Feature Checklist */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-700 mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Rapid Same-Day Diagnosis
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Bring your device to New Ranip for immediate power-rail and display fault diagnosis.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 mt-0.5">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Save Up to 70% vs Board Replacement
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        We repair blown chips, resistors, and controllers instead of replacing the entire motherboard.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-purple-100 text-purple-700 mt-0.5">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Strict Data Privacy & Integrity
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Your private documents, photos, and files are never touched or formatted without consent.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Action Prompt */}
                <div className="pt-2">
                  <a
                    href="#diagnostic-form"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <span>Check Your Device’s Issue Online</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE SERVICES SECTION */}
      <section id="services" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Heading */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wider uppercase border border-blue-100">
              Comprehensive Hardware Solutions
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0B132B] tracking-tight">
              Engineered Technology Services in Ahmedabad
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              From microscopic component-level soldering to high-performance custom liquid-cooled PC builds, our workshop delivers dependable hardware engineering.
            </p>
          </div>

          {/* 8-Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {servicesList.map((srv) => {
              const Icon = srv.icon;
              return (
                <div
                  key={srv.id}
                  className="bg-slate-50/70 hover:bg-white rounded-2xl border border-slate-200/90 p-6 tech-card-hover flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100">
                        {srv.tag}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {srv.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {srv.desc}
                      </p>
                    </div>

                    <ul className="space-y-1.5 pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                      {srv.points.map((pt, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-5 mt-5 border-t border-slate-200/60">
                    <a
                      href={`https://wa.me/919662278994?text=${encodeURIComponent(srv.whatsappText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-900 text-slate-700 hover:text-white font-semibold text-xs border border-slate-200 hover:border-slate-900 transition flex items-center justify-center gap-1.5 group-hover:border-blue-300"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Inquire on WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE DIAGNOSTIC INTAKE & INSTANT QUOTE FORM */}
      <section id="diagnostic-form" className="py-16 sm:py-24 bg-slate-100/70 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-8">
            {/* Header */}
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-200">
                <Wrench className="w-3.5 h-3.5" />
                <span>Instant Service Estimation</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0B132B] tracking-tight">
                Request Diagnostic or Repair Quote
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Describe your device issue below. Our hardware engineer in New Ranip, Ahmedabad will analyze the symptoms and provide an upfront estimate.
              </p>
            </div>

            {formSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-in fade-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-emerald-900">
                    Inquiry Registered Successfully!
                  </h3>
                  <p className="text-xs text-emerald-700">
                    Reference Ticket: <strong className="font-mono text-emerald-900">{formSuccess.inquiryId}</strong>
                  </p>
                  <p className="text-xs text-emerald-600 max-w-md mx-auto pt-1">
                    Thank you, <strong className="text-emerald-900">{formSuccess.customerName}</strong>. For the fastest response, send these details directly to our technician’s WhatsApp:
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <a
                    href={formSuccess.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send to WhatsApp Now (Recommended)</span>
                  </a>

                  <button
                    onClick={() => {
                      setFormSuccess(null);
                      setFormData({
                        name: '',
                        phone: '',
                        deviceType: 'Laptop',
                        brand: '',
                        issueCategory: 'Power Issue / Won\'t Turn On',
                        description: '',
                        locality: 'New Ranip',
                      });
                    }}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 transition"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Mobile Number (10 Digits) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9662278994"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Device Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Device Type *
                    </label>
                    <select
                      value={formData.deviceType}
                      onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    >
                      <option value="Laptop">Laptop</option>
                      <option value="Desktop PC">Desktop PC</option>
                      <option value="Custom Gaming PC">Custom Gaming PC</option>
                      <option value="All-in-One PC">All-in-One PC</option>
                      <option value="Server / Workstation">Server / Workstation</option>
                      <option value="Other">Other Hardware</option>
                    </select>
                  </div>

                  {/* Brand / Model */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Brand & Model
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dell Latitude 5410 / HP Pavilion"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  {/* Ahmedabad Locality */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Your Ahmedabad Locality
                    </label>
                    <select
                      value={formData.locality}
                      onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    >
                      <option value="New Ranip">New Ranip</option>
                      <option value="Ranip">Ranip</option>
                      <option value="Chandkheda">Chandkheda</option>
                      <option value="Sabarmati">Sabarmati</option>
                      <option value="Motera">Motera</option>
                      <option value="Ghatlodiya">Ghatlodiya</option>
                      <option value="Gota">Gota</option>
                      <option value="Chandlodiya">Chandlodiya</option>
                      <option value="SG Highway">SG Highway</option>
                      <option value="Naranpura">Naranpura</option>
                      <option value="Memnagar">Memnagar</option>
                      <option value="Other Ahmedabad">Other Area in Ahmedabad</option>
                    </select>
                  </div>
                </div>

                {/* Issue Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Primary Issue or Service Required *
                  </label>
                  <select
                    value={formData.issueCategory}
                    onChange={(e) => setFormData({ ...formData, issueCategory: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="Power Issue / Won't Turn On">Power Issue / Dead / Won't Turn On</option>
                    <option value="No Display / Blank Screen / Backlight Failure">No Display / Blank Screen / Backlight Failure</option>
                    <option value="Motherboard Short Circuit / Liquid Damage">Motherboard Short Circuit / Liquid Spill</option>
                    <option value="Needs SSD / RAM Speed Upgrade">Needs SSD / RAM Speed Upgrade</option>
                    <option value="Broken Screen / Loose Hinge Fabrication">Broken Screen / Loose Hinge Fabrication</option>
                    <option value="Battery Draining / Not Charging">Battery Draining / Not Charging</option>
                    <option value="Overheating / High Fan Noise / Thermal Service">Overheating / High Fan Noise / Thermal Service</option>
                    <option value="Windows OS / Blue Screen / Virus Eradication">Windows OS / Blue Screen / Virus Eradication</option>
                    <option value="Custom Gaming or Workstation PC Build Quote">Custom Gaming or Workstation PC Build Quote</option>
                    <option value="Purchase Refurbished Business Laptop">Purchase Refurbished Business Laptop</option>
                    <option value="Other Hardware Concern">Other Hardware Concern</option>
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Problem Details & Symptoms *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Briefly describe what happened (e.g. laptop turned off during charging and power LED does not glow, or want quotation for 1TB NVMe SSD + 16GB RAM upgrade)..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Free phone consultation • No upfront charge for basic check</span>
                  </div>

                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                  >
                    {formSubmitting ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <span>Submit Diagnosis Request</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 6. LIVE CERTIFIED INVENTORY & HARDWARE CATALOG */}
      <section id="inventory" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wider uppercase border border-blue-100">
                Verified Available Hardware
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0B132B] tracking-tight">
                Certified Refurbished Laptops & Components
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                Real-time stock from our Ahmedabad store. Grade-A enterprise machines bench-tested with 6 months hardware warranty.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {[
                { id: 'All', label: 'All Models' },
                { id: 'Refurbished Laptop', label: '💻 Laptops' },
                { id: 'Desktop', label: '🖥️ Desktops' },
                { id: 'SSD', label: '⚡ SSDs' },
                { id: 'RAM', label: '🧠 RAM' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? 'bg-[#0B132B] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {productsLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-16 bg-slate-200 rounded w-full" />
                  <div className="h-8 bg-slate-200 rounded w-1/2 mt-4" />
                </div>
              ))
            ) : products.length === 0 ? (
              <div className="col-span-full py-16 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <Laptop className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No products currently listed in this category.</p>
                <p>Please contact us directly on WhatsApp to check offline stock arrival.</p>
                <a
                  href="https://wa.me/919662278994?text=Hello%20Ashirwad%20Technologies,%20please%20check%20laptop/hardware%20availability%20for%20me."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold mt-2"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Check Current Availability</span>
                </a>
              </div>
            ) : (
              products.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                        {item.brand || item.category}
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full ${
                          item.currentStock > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.currentStock > 0 ? `${item.currentStock} Available` : 'Call for Stock'}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                      {item.name}
                    </h3>

                    {/* Hardware Specs Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.cpu && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          <Cpu className="w-3 h-3 text-slate-500" />
                          {item.cpu}
                        </span>
                      )}
                      {item.ram && (
                        <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {item.ram}
                        </span>
                      )}
                      {item.storage && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          <HardDrive className="w-3 h-3 text-slate-500" />
                          {item.storage}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                        Price (GST Incl.)
                      </span>
                      <span className="text-base font-black text-slate-900">
                        {formatCurrency(item.sellingPrice)}
                      </span>
                    </div>

                    <a
                      href={`https://wa.me/919662278994?text=${encodeURIComponent(
                        `Hello Ashirwad Technologies, I am interested in purchasing: ${item.name} (Price: ${formatCurrency(
                          item.sellingPrice
                        )}). Is this available for delivery in Ahmedabad?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                      title="Buy / Inquire via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Reserve</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 7. CUSTOM PC BUILDS SECTION */}
      <section id="custom-builds" className="py-16 sm:py-24 bg-slate-100/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wider uppercase border border-blue-100">
              Zero Bottlenecks • Tailored Configurations
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0B132B] tracking-tight">
              Custom High-Performance PC Builds in Ahmedabad
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Every system is assembled with meticulous cable routing, thermal stress testing, and component matching to provide maximum FPS and sustained workstation throughput.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Build 1: Esports & 1080p Gaming */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                  Tier 1: High FPS Gaming
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  Esports & 1080p Gaming Rig
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tailored for competitive titles like Valorant, CS2, GTA V, and AAA gaming at smooth 1080p high refresh rates.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Intel Core i5 / AMD Ryzen 5 Series</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>NVIDIA RTX 4060 / 3060 8GB / 12GB</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>16GB Dual-Channel DDR4/DDR5 RAM</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>1TB High-Speed NVMe M.2 SSD</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Bronze Certified Tier-1 Power Supply</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <a
                  href="https://wa.me/919662278994?text=Hello%20Ashirwad%20Technologies,%20I%20would%20like%20a%20quotation%20for%20an%20Esports%20Gaming%20PC%20Build."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Get Gaming PC Quote</span>
                </a>
              </div>
            </div>

            {/* Build 2: Video Editing & 4K Workstation */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-600 shadow-md space-y-5 flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                Most Popular Workstation
              </div>

              <div className="space-y-4 pt-1">
                <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                  Tier 2: Content Creation
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  4K Video Editing & 3D CAD
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Optimized for Premiere Pro, After Effects, DaVinci Resolve, Blender, AutoCAD, and heavy multitasking.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Intel Core i7 / AMD Ryzen 7 12-Core+</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>NVIDIA RTX 4070 12GB / RTX 4060Ti 16GB</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>32GB High-Speed DDR5 RAM (Expandable)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>2TB PCIe Gen4 NVMe (7000MB/s Read)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>240mm/360mm AIO Liquid Cooling</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <a
                  href="https://wa.me/919662278994?text=Hello%20Ashirwad%20Technologies,%20I%20am%20looking%20for%20a%204K%20Video%20Editing/Rendering%20Workstation%20Quote."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Get Workstation Quote</span>
                </a>
              </div>
            </div>

            {/* Build 3: Multi-Monitor Trading & Enterprise */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                  Tier 3: Multi-Screen Trading
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  Day-Trading & Stock Market Setup
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Engineered for ultra-low latency, multi-monitor display outputs (3 to 6 screens), and continuous rock-solid stability.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Support for 4 to 6 Independent Monitors</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>32GB RAM for Instant Chart Refresh</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Dual NVMe SSDs (Dedicated OS + Data)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Silent High-Airflow Acoustic Casing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Pre-configured Dual-Band Wi-Fi 6 & 2.5G LAN</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <a
                  href="https://wa.me/919662278994?text=Hello%20Ashirwad%20Technologies,%20I%20am%20interested%20in%20a%20Multi-Monitor%20Trading%20PC%20Setup."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Get Trading PC Quote</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. OUR 5-STEP REPAIR PROCESS */}
      <section id="process" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wider uppercase border border-blue-100">
              Standardized Workflow
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0B132B] tracking-tight">
              Our 5-Step Repair & Service Process
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              No guesswork, no unexpected invoices. You know the exact status of your device at every stage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                step: '01',
                title: 'Intake & Inspection',
                desc: 'Device check-in at New Ranip with initial physical symptom and power rail assessment.',
              },
              {
                step: '02',
                title: 'Clear Upfront Estimate',
                desc: 'We inform you of the exact fault and provide a transparent quote before any work starts.',
              },
              {
                step: '03',
                title: 'Precision Micro-Repair',
                desc: 'Component-level soldering, IC replacement, or upgrade executed in an ESD-protected lab.',
              },
              {
                step: '04',
                title: 'Multi-Point Stress Test',
                desc: 'Rigorous benchmark of CPU, thermals, battery health, display, and memory stability.',
              },
              {
                step: '05',
                title: 'Pickup & Warranty',
                desc: 'Device handed over clean and tested, backed by our 6-month hardware warranty.',
              },
            ].map((st, i) => (
              <div
                key={i}
                className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 relative space-y-3"
              >
                <div className="text-2xl font-black text-blue-600/30">
                  {st.step}
                </div>
                <h3 className="text-sm font-bold text-slate-900">{st.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. REAL-TIME HARDWARE SERIAL & WARRANTY VERIFIER */}
      <section id="warranty-check" className="py-16 sm:py-24 bg-slate-100/70 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold tracking-wider uppercase border border-purple-200">
              <Laptop className="w-3.5 h-3.5" />
              <span>Customer Transparency Tool</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B132B] tracking-tight">
              Hardware Serial & Warranty Verifier
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              Did you purchase a refurbished laptop or desktop from Ashirwad Technologies? Enter your device serial number from the bottom cover sticker to verify active warranty and hardware specifications.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            {/* Input Form */}
            <form onSubmit={handleSerialSearch} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={serialQuery}
                  onChange={(e) => setSerialQuery(e.target.value)}
                  placeholder="Enter Serial Number (e.g. DL5410-XYZ-9981 or customer name)..."
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono transition"
                />
              </div>
              <button
                type="submit"
                disabled={searchingSerial}
                className="px-6 py-3 bg-[#0B132B] hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
              >
                {searchingSerial ? 'Checking Database...' : 'Verify Status'}
              </button>
            </form>

            {/* Results Display */}
            {serialSearched && (
              <div className="pt-2 animate-in fade-in duration-200">
                {serialResult ? (
                  <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-purple-950">
                          {serialResult.serialNumber}
                        </span>
                        <button
                          onClick={() => copyToClipboard(serialResult.serialNumber)}
                          className="p-1 text-purple-600 hover:text-purple-800"
                          title="Copy Serial Number"
                        >
                          {copiedSerial ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            serialResult.status === 'Sold'
                              ? 'bg-blue-100 text-blue-800'
                              : serialResult.status === 'In Stock'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {serialResult.status === 'Sold' ? '✓ Registered to Customer' : serialResult.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">
                        {serialResult.product?.name || 'Refurbished Computer Unit'}
                      </h4>

                      <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                        {serialResult.customer && (
                          <span>
                            Customer: <strong className="text-slate-800">{serialResult.customer.name}</strong>
                          </span>
                        )}
                        {serialResult.saleDate && (
                          <span>
                            Date of Purchase: <strong>{formatDate(serialResult.saleDate)}</strong>
                          </span>
                        )}
                        {serialResult.warrantyEnd && (
                          <span className="text-emerald-700 font-bold">
                            Warranty Valid Until: {formatDate(serialResult.warrantyEnd)}
                          </span>
                        )}
                        {serialResult.status === 'In Stock' && (
                          <span className="text-emerald-700 font-bold">
                            ✓ In Stock & Bench Tested — Ready for Immediate Handover
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <a
                        href={`https://wa.me/919662278994?text=${encodeURIComponent(
                          `Hello Ashirwad Technologies, I have a warranty inquiry for serial number: ${serialResult.serialNumber}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Warranty Assistance</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">
                      No matching hardware serial number found for "{serialQuery}".
                    </p>
                    <p>
                      Please verify the serial tag sticker located on the laptop bottom cover, or message us on WhatsApp with a photo of the sticker.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 10. REASONS TO TRUST ASHIRWAD TECHNOLOGIES */}
      <section id="why-us" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wider uppercase border border-blue-100">
              Why Choose Us
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0B132B] tracking-tight">
              Why Ahmedabad Trusts Ashirwad Technologies
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              We focus on technical precision and transparent business ethics. Here is why businesses, students, and professionals rely on us.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-700 w-fit">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Component-Level Cost Savings
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rather than replacing costly motherboards, our microscope-guided micro-soldering fixes individual damaged chips, saving you up to 70% in repair expenses.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 w-fit">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                6 Months Hardware Warranty
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We stand behind every refurbished laptop sold and major repair completed with a genuine 6-month hardware warranty for peace of mind.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="p-3 rounded-xl bg-purple-100 text-purple-700 w-fit">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                100% Data Confidentiality
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your personal documents, accounting records, and family photos are strictly protected. We never format or browse your private data without consent.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-700 w-fit">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Quick Same-Day Turnaround
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Most common upgrades, screen replacements, and OS installations are completed within 2 to 4 hours so you can get back to work immediately.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="p-3 rounded-xl bg-sky-100 text-sky-700 w-fit">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                100% Bench-Tested Components
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every component is stress-tested under load to verify operating temperatures, battery health, and memory integrity before leaving the workshop.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="p-3 rounded-xl bg-indigo-100 text-indigo-700 w-fit">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Convenient Ahmedabad Location
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Centrally located in New Ranip with easy access from Chandkheda, Sabarmati, Motera, Gota, and Ghatlodiya, with doorstep pickup options.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section id="faq" className="py-16 sm:py-24 bg-slate-100/70 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wider uppercase border border-blue-200">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B132B] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Clear answers regarding pricing, turnaround time, warranty terms, and data safety.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-blue-600 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 12. STORE LOCATION, CONTACT & FOOTER */}
      <footer id="contact" className="bg-[#0B132B] text-slate-300 pt-16 pb-24 lg:pb-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Col 1: Brand & Tagline */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white p-1 shrink-0">
                  <img
                    src="/brand/logo.png"
                    alt="Ashirwad Technologies Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="text-base font-black tracking-tight text-white leading-none">
                    ASHIRWAD TECHNOLOGIES
                  </div>
                  <div className="text-[11px] font-bold text-blue-400 tracking-widest uppercase mt-1">
                    Beyond Tech Limits...
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Ahmedabad's dedicated computer hardware, chip-level laptop repair, certified refurbished laptops, and custom PC engineering center.
              </p>

              <div className="pt-1 flex items-center gap-3">
                <a
                  href="https://wa.me/919662278994"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a
                  href="tel:+919662278994"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition"
                  title="Call Us"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <a
                  href="mailto:rajsoni2962@gmail.com"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white transition"
                  title="Email Us"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Services & Solutions
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#services" className="hover:text-blue-400 transition">Laptop & PC Repair</a></li>
                <li><a href="#services" className="hover:text-blue-400 transition">Motherboard Micro-Soldering</a></li>
                <li><a href="#services" className="hover:text-blue-400 transition">SSD & RAM Speed Upgrades</a></li>
                <li><a href="#custom-builds" className="hover:text-blue-400 transition">Custom Gaming & Workstation PCs</a></li>
                <li><a href="#inventory" className="hover:text-blue-400 transition">Refurbished Business Laptops</a></li>
                <li><a href="#services" className="hover:text-blue-400 transition">Windows 11 Setup & Optimization</a></li>
              </ul>
            </div>

            {/* Col 3: Workshop Contact Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Workshop & Contact
              </h4>
              <div className="space-y-2.5 text-xs text-slate-400">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    Ashraya 10, GST compound, New Ranip, Ahmedabad 382470, Gujarat.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a href="tel:+919662278994" className="hover:text-white transition font-medium">
                    +91 9662278994
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                  <a href="mailto:rajsoni2962@gmail.com" className="hover:text-white transition">
                    rajsoni2962@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Mon–Sat: 10:00 AM – 8:30 PM (Sun by Appointment)</span>
                </div>
              </div>
            </div>

            {/* Col 4: Ahmedabad Service Coverage */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Service Areas in Ahmedabad
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Doorstep pickup, on-site diagnostics, and delivery across:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'New Ranip',
                  'Ranip',
                  'Chandkheda',
                  'Sabarmati',
                  'Motera',
                  'Ghatlodiya',
                  'Gota',
                  'Chandlodiya',
                  'SG Highway',
                  'Naranpura',
                  'Memnagar',
                  'Ahmedabad'
                ].map((area) => (
                  <span
                    key={area}
                    className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700/60"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Staff Link */}
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © {new Date().getFullYear()} Ashirwad Technologies. All rights reserved.
            </div>

            <div className="flex items-center gap-4">
              <a href="#services" className="hover:text-slate-400 transition">Services</a>
              <a href="#warranty-check" className="hover:text-slate-400 transition">Warranty</a>
              <a href="#contact" className="hover:text-slate-400 transition">Locate Us</a>
              <span className="text-slate-700">•</span>
              <Link
                href="/dashboard"
                className="text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                <Lock className="w-3 h-3 text-slate-500" />
                <span>Staff Portal / ERP</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* 13. MOBILE FLOATING ACTION BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-2xl flex items-center justify-around gap-2">
        <a
          href="tel:+919662278994"
          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
        >
          <Phone className="w-4 h-4 text-blue-400" />
          <span>Call Now</span>
        </a>

        <a
          href="https://wa.me/919662278994?text=Hello%20Ashirwad%20Technologies,%20I%20have%20an%20inquiry%20regarding%20laptop/PC%20repair."
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp</span>
        </a>

        <a
          href="#diagnostic-form"
          className="py-2.5 px-3 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center gap-1 border border-blue-200"
        >
          <Wrench className="w-4 h-4 text-blue-600" />
          <span>Diagnosis</span>
        </a>
      </div>
    </div>
  );
}
