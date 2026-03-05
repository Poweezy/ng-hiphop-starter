# Contributing to NG Hip-Hop Platform

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🎯 Code Standards

### TypeScript
- Use strict TypeScript (no `any` types)
- Define interfaces for all props and data structures
- Use Zod for runtime validation

### React Components
- Use functional components with hooks
- Keep components focused and single-purpose
- Use proper TypeScript types for props
- Add proper ARIA labels for accessibility

### Styling
- Use CSS custom properties (variables)
- Follow mobile-first responsive design
- Maintain consistent spacing and typography
- Ensure minimum 44px touch targets

### API Routes
- Validate all inputs with Zod schemas
- Use consistent error responses
- Add proper error logging
- Implement pagination for list endpoints
- Check authentication/authorization

## 📝 Commit Messages

Follow conventional commits:

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

Examples:
```
feat: Add delete confirmation dialog to admin panel
fix: Resolve carousel memory leak in GraffitiShowcase
docs: Update deployment guide with Railway instructions
```

## 🔧 Development Workflow

1. **Create a branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes**
- Write clean, documented code
- Follow existing patterns
- Test thoroughly

3. **Test locally**
```bash
npm run dev
npm run build
```

4. **Commit changes**
```bash
git add .
git commit -m "feat: your feature description"
```

5. **Push and create PR**
```bash
git push origin feature/your-feature-name
```

## 🧪 Testing Guidelines

### Manual Testing Checklist
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile devices
- [ ] Test all form submissions
- [ ] Test error states
- [ ] Test loading states
- [ ] Verify accessibility (keyboard navigation)

### Before Submitting PR
- [ ] Code builds without errors
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Responsive on all screen sizes
- [ ] Accessible (WCAG AA)

## 🎨 Design Guidelines

### Colors
Use CSS custom properties:
- `--color-purple`: Primary brand color
- `--color-green`: Success/active states
- `--color-yellow`: Warnings/highlights
- `--color-grey-blue`: Secondary text

### Typography
- Display: `var(--font-display)` - Headers
- Condensed: `var(--font-condensed)` - UI elements
- Body: `var(--font-body)` - Content
- Cursive: `var(--font-cursive)` - Accents

### Spacing
Use clamp() for responsive spacing:
```css
padding: clamp(16px, 4vw, 48px);
```

## 🔒 Security Guidelines

### Never Commit
- `.env` files
- API keys or secrets
- Database credentials
- Private keys

### Always
- Validate user input
- Sanitize data before display
- Use parameterized queries (Prisma handles this)
- Check authentication on protected routes
- Rate limit public endpoints

## 📚 Documentation

### Code Comments
- Explain "why", not "what"
- Document complex logic
- Add JSDoc for public functions

### README Updates
Update README when:
- Adding new features
- Changing setup process
- Adding dependencies
- Modifying configuration

## 🐛 Bug Reports

Include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser/device information
- Error messages/logs

## 💡 Feature Requests

Include:
- Clear use case
- Expected behavior
- Mockups if applicable
- Potential implementation approach

## 📞 Questions?

- Check existing documentation
- Review closed issues
- Ask in discussions

---

**Thank you for contributing to NG Hip-Hop Platform!** 🎤
