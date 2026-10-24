import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const backupDestDir = path.join(path.dirname(projectRoot), 'Apna_Vyaapar_Local_Backup');

console.log('================================================================');
console.log('  LOCAL PROJECT COMPLETE BACKUP & VERIFICATION PROTOCOL');
console.log('================================================================\n');
console.log(`Source Project: ${projectRoot}`);
console.log(`Backup Destination: ${backupDestDir}\n`);

// Exclude large transient folders (node_modules, .next) but keep .git, source code, configs, assets
const EXCLUDE_DIRS = new Set(['node_modules', '.next']);

interface FileEntry {
  relPath: string;
  size: number;
}

function scanDir(dir: string, base: string = dir): FileEntry[] {
  let results: FileEntry[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) {
        continue;
      }
      results = results.concat(scanDir(path.join(dir, entry.name), base));
    } else if (entry.isFile()) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(base, fullPath);
      const stat = fs.statSync(fullPath);
      results.push({ relPath, size: stat.size });
    }
  }

  return results;
}

function copyFileWithDir(src: string, dest: string) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

async function main() {
  console.log('1. Scanning local project files...');
  const sourceFiles = scanDir(projectRoot);
  const totalSourceBytes = sourceFiles.reduce((sum, f) => sum + f.size, 0);

  console.log(`✓ Total Files Identified: ${sourceFiles.length}`);
  console.log(`✓ Total Source Size: ${(totalSourceBytes / (1024 * 1024)).toFixed(2)} MB\n`);

  console.log('2. Copying complete project to external backup location...');
  if (!fs.existsSync(backupDestDir)) {
    fs.mkdirSync(backupDestDir, { recursive: true });
  }

  let copiedCount = 0;
  for (const f of sourceFiles) {
    const srcFile = path.join(projectRoot, f.relPath);
    const destFile = path.join(backupDestDir, f.relPath);
    copyFileWithDir(srcFile, destFile);
    copiedCount++;
  }
  console.log(`✓ Copied ${copiedCount} files to ${backupDestDir}\n`);

  console.log('3. Verifying backup integrity...');
  const destFiles = scanDir(backupDestDir);
  const totalDestBytes = destFiles.reduce((sum, f) => sum + f.size, 0);

  const destFileMap = new Map(destFiles.map((f) => [f.relPath, f.size]));

  let mismatched = 0;
  let missing = 0;

  for (const src of sourceFiles) {
    const destSize = destFileMap.get(src.relPath);
    if (destSize === undefined) {
      console.error(`❌ MISSING FILE in backup: ${src.relPath}`);
      missing++;
    } else if (destSize !== src.size) {
      console.error(`❌ SIZE MISMATCH: ${src.relPath} (src: ${src.size}, dest: ${destSize})`);
      mismatched++;
    }
  }

  console.log('\n--- VERIFICATION AUDIT RESULTS ---');
  console.log(`• Source Files: ${sourceFiles.length} | Backup Files: ${destFiles.length}`);
  console.log(`• Source Size: ${(totalSourceBytes / (1024 * 1024)).toFixed(2)} MB | Backup Size: ${(totalDestBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`• Missing Files: ${missing}`);
  console.log(`• Mismatched Files: ${mismatched}`);

  if (missing > 0 || mismatched > 0 || sourceFiles.length !== destFiles.length) {
    throw new Error('BACKUP VERIFICATION FAILED! Integrity compromised.');
  }

  console.log('\n================================================================');
  console.log('🎉 SUCCESS: LOCAL PROJECT FULLY PRESERVED & 100% VERIFIED!');
  console.log(`📁 Backup Location: ${backupDestDir}`);
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('Fatal error during backup:', err);
  process.exit(1);
});
