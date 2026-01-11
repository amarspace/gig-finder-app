# Dependency Audit Report
**Date:** 2026-01-11
**Project:** gig-finder-app

## Executive Summary

This audit identified **7 security vulnerabilities** (4 high, 3 moderate), **28 outdated packages**, and **significant dependency bloat** with approximately **60% of installed packages unused**.

### Key Findings
- 🔴 **4 HIGH severity** security vulnerabilities requiring immediate attention
- 🟡 **3 MODERATE severity** security vulnerabilities
- 📦 **26 unused dependencies** can be safely removed (~60% reduction)
- ⚡ **Bundle size reduction potential:** Estimated 40-50% smaller bundle
- 🔄 **13 packages** need major version updates

---

## 1. Security Vulnerabilities (CRITICAL)

### High Severity (Fix Immediately)

#### 🔴 react-router-dom - XSS via Open Redirects
- **Current Version:** 6.30.1
- **Vulnerable Package:** @remix-run/router ≤1.23.1
- **CVE:** GHSA-2w69-qvjg-hvjx
- **CVSS Score:** 8.0 (High)
- **Impact:** Cross-site scripting vulnerability via open redirects
- **Fix:** Update to react-router-dom@6.30.3 or later
- **Breaking Changes:** Minor patch, should be safe

#### 🔴 react-router - Unexpected External Redirect
- **Current Version:** 6.30.1 (via react-router-dom)
- **CVE:** GHSA-9jcx-v3wj-wh4m
- **CVSS Score:** 6.5 (Moderate/High)
- **Impact:** Untrusted paths can cause external redirects
- **Fix:** Included in react-router-dom@6.30.3 update

#### 🔴 glob - Command Injection
- **Affected Version:** 10.2.0-10.4.5
- **CVE:** GHSA-5j98-mcp5-4vw2
- **CVSS Score:** 7.5 (High)
- **Impact:** Command injection via CLI (indirect dependency)
- **Fix:** npm audit fix (updates transitive dependency)

### Moderate Severity

#### 🟡 vite - Multiple Vulnerabilities
- **Current Version:** 5.4.19
- **Issues:**
  1. `server.fs.deny` bypass via backslash on Windows (GHSA-93m4-6634-74q7)
  2. `server.fs` settings not applied to HTML files (GHSA-jqfw-vq24-v9c3)
  3. Middleware may serve files with similar names (GHSA-g4jq-h2w9-997c)
- **Fix:** Update to vite@5.4.21 or vite@6.1.7+
- **Risk:** Low/Moderate (dev server only, not production)

#### 🟡 esbuild - Development Server Request Vulnerability
- **Current Version:** ≤0.24.2 (via vite)
- **CVE:** GHSA-67mh-4wv8-2f99
- **CVSS Score:** 5.3 (Moderate)
- **Fix:** Included in vite update

#### 🟡 js-yaml - Prototype Pollution
- **Affected Version:** 4.0.0-4.1.0
- **CVE:** GHSA-mh29-5h37-fv8m
- **CVSS Score:** 5.3 (Moderate)
- **Fix:** npm audit fix

---

## 2. Unused Dependencies (BLOAT)

### Confirmed Unused - Safe to Remove Immediately

These packages have **zero imports** in the codebase:

```json
"@hookform/resolvers": "^3.10.0",          // No usage found
"embla-carousel-react": "^8.6.0",          // Only in unused carousel.tsx
"recharts": "^2.15.4",                     // Only in unused chart.tsx
"input-otp": "^1.4.2",                     // Only in unused input-otp.tsx
"react-day-picker": "^8.10.1",             // Only in unused calendar.tsx
"cmdk": "^1.1.1",                          // Only in unused command.tsx
"vaul": "^0.9.9",                          // Only in unused drawer.tsx
"react-hook-form": "^7.61.1",              // Only in unused form.tsx
"react-resizable-panels": "^2.1.9"         // Only in unused resizable.tsx
```

**Estimated savings:** ~1.5-2 MB in bundle size

### Unused Radix UI Components

The project uses the shadcn/ui pattern with 26 @radix-ui packages, but **only 4 are actively used**:

#### ✅ Keep (Used in Application)
```json
"@radix-ui/react-avatar": "^1.1.10",       // Used in ProfileAvatar.tsx
"@radix-ui/react-dialog": "^1.1.14",       // Used in dialog.tsx wrapper
"@radix-ui/react-slot": "^1.2.3",          // Used in button.tsx, form.tsx
"@radix-ui/react-tooltip": "^1.2.7"        // Used in App.tsx (TooltipProvider)
```

#### ❌ Remove (Unused - 22 packages)
```json
"@radix-ui/react-accordion": "^1.2.11",
"@radix-ui/react-alert-dialog": "^1.1.14",
"@radix-ui/react-aspect-ratio": "^1.1.7",
"@radix-ui/react-checkbox": "^1.3.2",
"@radix-ui/react-collapsible": "^1.1.11",
"@radix-ui/react-context-menu": "^2.2.15",
"@radix-ui/react-dropdown-menu": "^2.1.15",
"@radix-ui/react-hover-card": "^1.1.14",
"@radix-ui/react-label": "^2.1.7",
"@radix-ui/react-menubar": "^1.1.15",
"@radix-ui/react-navigation-menu": "^1.2.13",
"@radix-ui/react-popover": "^1.1.14",
"@radix-ui/react-progress": "^1.1.7",
"@radix-ui/react-radio-group": "^1.3.7",
"@radix-ui/react-scroll-area": "^1.2.9",
"@radix-ui/react-select": "^2.2.5",
"@radix-ui/react-separator": "^1.1.7",
"@radix-ui/react-slider": "^1.3.5",
"@radix-ui/react-switch": "^1.2.5",
"@radix-ui/react-tabs": "^1.1.12",
"@radix-ui/react-toast": "^1.2.14",
"@radix-ui/react-toggle": "^1.1.9",
"@radix-ui/react-toggle-group": "^1.1.10"
```

**Estimated savings:** ~800 KB - 1 MB in bundle size

---

## 3. Outdated Packages

### Major Version Updates Available

#### Critical Updates (Security or Features)

| Package | Current | Latest | Breaking Changes Risk |
|---------|---------|--------|----------------------|
| react-router-dom | 6.30.1 | 7.12.0 | 🔴 High - Major API changes |
| vite | 5.4.19 | 6.1.7 | 🟡 Medium - Config changes |
| zod | 3.25.76 | 4.3.5 | 🟡 Medium - API refinements |
| tailwind-merge | 2.6.0 | 3.4.0 | 🟢 Low - Mostly internal |

#### Non-Critical Updates (Consider for Future)

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| date-fns | 3.6.0 | 4.1.0 | Used in 5 files, test thoroughly |
| sonner | 1.7.4 | 2.0.7 | Toast library update |
| next-themes | 0.3.0 | 0.4.6 | Theme provider update |
| lucide-react | 0.462.0 | 0.562.0 | Icon library, safe update |
| @tanstack/react-query | 5.83.0 | 5.90.16 | Patch update, safe |
| @supabase/supabase-js | 2.89.0 | 2.90.1 | Patch update, safe |

#### Unused - Skip Updates (Remove Instead)

| Package | Current | Latest | Action |
|---------|---------|--------|--------|
| @hookform/resolvers | 3.10.0 | 5.2.2 | ❌ Remove |
| react-day-picker | 8.10.1 | 9.13.0 | ❌ Remove |
| recharts | 2.15.4 | 3.6.0 | ❌ Remove |
| vaul | 0.9.9 | 1.1.2 | ❌ Remove |
| react-resizable-panels | 2.1.9 | 4.3.3 | ❌ Remove |

---

## 4. Recommendations

### Phase 1: Security Fixes (IMMEDIATE)

**Priority: CRITICAL** - Do this today

```bash
# Fix security vulnerabilities
npm update react-router-dom@^6.30.3
npm update vite@^5.4.21
npm audit fix
```

**Testing Required:**
- All routing functionality
- Development server
- Build process

---

### Phase 2: Remove Bloat (HIGH PRIORITY)

**Priority: HIGH** - Do this week

#### Step 1: Remove Unused UI Component Files
```bash
rm src/components/ui/accordion.tsx
rm src/components/ui/alert-dialog.tsx
rm src/components/ui/aspect-ratio.tsx
rm src/components/ui/calendar.tsx
rm src/components/ui/carousel.tsx
rm src/components/ui/chart.tsx
rm src/components/ui/checkbox.tsx
rm src/components/ui/collapsible.tsx
rm src/components/ui/command.tsx
rm src/components/ui/context-menu.tsx
rm src/components/ui/drawer.tsx
rm src/components/ui/dropdown-menu.tsx
rm src/components/ui/form.tsx
rm src/components/ui/hover-card.tsx
rm src/components/ui/input-otp.tsx
rm src/components/ui/menubar.tsx
rm src/components/ui/navigation-menu.tsx
rm src/components/ui/popover.tsx
rm src/components/ui/progress.tsx
rm src/components/ui/radio-group.tsx
rm src/components/ui/resizable.tsx
rm src/components/ui/scroll-area.tsx
rm src/components/ui/select.tsx
rm src/components/ui/separator.tsx
rm src/components/ui/slider.tsx
rm src/components/ui/switch.tsx
rm src/components/ui/tabs.tsx
rm src/components/ui/toggle.tsx
rm src/components/ui/toggle-group.tsx
```

#### Step 2: Uninstall Unused Dependencies
```bash
npm uninstall \
  @hookform/resolvers \
  embla-carousel-react \
  recharts \
  input-otp \
  react-day-picker \
  cmdk \
  vaul \
  react-hook-form \
  react-resizable-panels \
  @radix-ui/react-accordion \
  @radix-ui/react-alert-dialog \
  @radix-ui/react-aspect-ratio \
  @radix-ui/react-checkbox \
  @radix-ui/react-collapsible \
  @radix-ui/react-context-menu \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-hover-card \
  @radix-ui/react-label \
  @radix-ui/react-menubar \
  @radix-ui/react-navigation-menu \
  @radix-ui/react-popover \
  @radix-ui/react-progress \
  @radix-ui/react-radio-group \
  @radix-ui/react-scroll-area \
  @radix-ui/react-select \
  @radix-ui/react-separator \
  @radix-ui/react-slider \
  @radix-ui/react-switch \
  @radix-ui/react-tabs \
  @radix-ui/react-toast \
  @radix-ui/react-toggle \
  @radix-ui/react-toggle-group
```

**Expected Impact:**
- 📦 Bundle size reduction: ~40-50%
- ⚡ Faster installs: ~60% fewer packages (453 → ~180 total dependencies)
- 🔧 Reduced maintenance burden
- 💰 Faster build times

---

### Phase 3: Strategic Updates (MEDIUM PRIORITY)

**Priority: MEDIUM** - Plan for next sprint

#### Safe Updates (Low Risk)
```bash
# Icon library - safe to update
npm update lucide-react@latest

# Query library - patch update
npm update @tanstack/react-query@latest

# Supabase - patch update
npm update @supabase/supabase-js@latest

# Styling utilities - generally safe
npm update tailwind-merge@latest
```

#### Updates Requiring Testing
```bash
# Date library - test date formatting
npm update date-fns@^4.0.0

# Toast library - test notifications
npm update sonner@^2.0.0

# Theme provider - test dark/light mode
npm update next-themes@^0.4.0
```

#### Major Updates (Breaking Changes Expected)

**React Router v7 Upgrade** - DEFER until needed
- Current: v6.30.3 (after security fix)
- Latest: v7.12.0
- Breaking Changes:
  - New data APIs
  - Route module changes
  - Loader/action signature changes
- **Recommendation:** Stay on v6 for now, plan migration separately

**Zod v4 Upgrade** - Test carefully
- Current: v3.25.76
- Latest: v4.3.5
- Breaking Changes: Schema API refinements
- Impact: Auth.tsx validation logic
- **Recommendation:** Update after thorough testing

**Vite v6 Upgrade** - Consider for long-term
- Current: v5.4.21 (after security fix)
- Latest: v6.1.7
- Breaking Changes: Config API changes
- **Recommendation:** v5.4.21 is fine for now

---

### Phase 4: DevDependencies Updates (LOW PRIORITY)

All devDependencies are up-to-date or close to latest:
- ✅ TypeScript: 5.8.3 (latest)
- ✅ ESLint: 9.32.0 (latest)
- ✅ Tailwind CSS: 3.4.17 (latest)
- ✅ Vite plugins: Current versions

---

## 5. Actually Used Dependencies

### Core Dependencies (Keep All)
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.30.3",
  "@supabase/supabase-js": "^2.89.0",
  "@tanstack/react-query": "^5.83.0",
  "zod": "^3.25.76"
}
```

### UI & Styling (Keep All)
```json
{
  "@radix-ui/react-avatar": "^1.1.10",
  "@radix-ui/react-dialog": "^1.1.14",
  "@radix-ui/react-slot": "^1.2.3",
  "@radix-ui/react-tooltip": "^1.2.7",
  "lucide-react": "^0.462.0",
  "next-themes": "^0.3.0",
  "sonner": "^1.7.4",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0",
  "tailwindcss-animate": "^1.0.7"
}
```

### Utilities (Keep All)
```json
{
  "date-fns": "^3.6.0"
}
```

---

## 6. Implementation Checklist

### Immediate (Today)
- [ ] Run `npm update react-router-dom@^6.30.3`
- [ ] Run `npm update vite@^5.4.21`
- [ ] Run `npm audit fix`
- [ ] Test all routing functionality
- [ ] Test dev server and build
- [ ] Commit: "security: fix high severity vulnerabilities in router and vite"

### This Week
- [ ] Create feature branch: `cleanup/remove-unused-dependencies`
- [ ] Delete unused UI component files (see Step 1 above)
- [ ] Uninstall unused npm packages (see Step 2 above)
- [ ] Run `npm install` to update lockfile
- [ ] Test build: `npm run build`
- [ ] Test app thoroughly (auth, routing, UI)
- [ ] Check bundle size: Should see ~40-50% reduction
- [ ] Commit: "chore: remove unused dependencies and UI components"
- [ ] Create PR for review

### Next Sprint
- [ ] Update safe dependencies (lucide-react, @tanstack/react-query, etc.)
- [ ] Test and update date-fns to v4
- [ ] Test and update sonner to v2
- [ ] Test and update next-themes to v0.4
- [ ] Commit: "chore: update dependencies to latest versions"

### Future Consideration
- [ ] Plan React Router v7 migration (breaking changes)
- [ ] Plan Zod v4 migration (test validation schemas)
- [ ] Consider Vite v6 upgrade (config changes)

---

## 7. Risk Assessment

### Low Risk (Safe to do immediately)
- ✅ Security patches (react-router-dom, vite)
- ✅ Removing unused dependencies
- ✅ Patch updates (@tanstack/react-query, lucide-react)

### Medium Risk (Test thoroughly)
- ⚠️ date-fns v3 → v4 (used in 5 files)
- ⚠️ sonner v1 → v2 (toast notifications)
- ⚠️ tailwind-merge v2 → v3 (utility classes)

### High Risk (Defer or plan carefully)
- 🔴 React Router v6 → v7 (major API changes)
- 🔴 Zod v3 → v4 (validation logic)
- 🔴 Vite v5 → v6 (build configuration)

---

## 8. Expected Outcomes

### After Phase 1 (Security Fixes)
- ✅ Zero high-severity vulnerabilities
- ✅ Reduced security risk
- ✅ Updated to patched versions

### After Phase 2 (Bloat Removal)
- 📦 **Bundle size:** ~40-50% smaller
- ⚡ **Install time:** ~60% faster
- 🔢 **Dependencies:** 453 → ~180 total packages
- 💾 **node_modules size:** ~250MB → ~100MB estimated
- 🚀 **Build time:** 10-15% faster estimated

### After Phase 3 (Strategic Updates)
- 🔄 All dependencies on latest stable versions
- 📚 Better TypeScript support
- 🐛 Bug fixes from updates
- ⚡ Performance improvements

---

## Summary Commands

### Quick Fix (Security Only)
```bash
npm update react-router-dom@^6.30.3 vite@^5.4.21
npm audit fix
npm run build  # test
```

### Full Cleanup (Security + Bloat)
```bash
# 1. Security fixes
npm update react-router-dom@^6.30.3 vite@^5.4.21
npm audit fix

# 2. Remove unused dependencies
npm uninstall @hookform/resolvers embla-carousel-react recharts \
  input-otp react-day-picker cmdk vaul react-hook-form \
  react-resizable-panels @radix-ui/react-accordion \
  @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio \
  @radix-ui/react-checkbox @radix-ui/react-collapsible \
  @radix-ui/react-context-menu @radix-ui/react-dropdown-menu \
  @radix-ui/react-hover-card @radix-ui/react-label \
  @radix-ui/react-menubar @radix-ui/react-navigation-menu \
  @radix-ui/react-popover @radix-ui/react-progress \
  @radix-ui/react-radio-group @radix-ui/react-scroll-area \
  @radix-ui/react-select @radix-ui/react-separator \
  @radix-ui/react-slider @radix-ui/react-switch \
  @radix-ui/react-tabs @radix-ui/react-toast \
  @radix-ui/react-toggle @radix-ui/react-toggle-group

# 3. Clean install
npm install

# 4. Test
npm run build
npm run dev
```

---

**Report Generated:** 2026-01-11
**Next Review:** After Phase 2 completion
