# Production Deployment Checklist - Pitcrew

Use this checklist to ensure all necessary steps are completed before deploying to production.

---

## Pre-Deployment Verification

### Code Quality
- [ ] All tests pass locally
- [ ] No console errors or warnings
- [ ] No unused dependencies or imports
- [ ] TypeScript compiles without errors
  ```bash
  npm run build
  ```
- [ ] No hardcoded API keys or secrets in code
- [ ] Environment variables are documented

### Security
- [ ] `.env` files are in `.gitignore`
- [ ] Database credentials are not in repository
- [ ] Sensitive data (private keys, API tokens) not committed
- [ ] CORS is configured to allow only Vercel domain
- [ ] Authentication/authorization checks are in place
- [ ] API rate limiting is configured
- [ ] Input validation is implemented

### Backend Specific
- [ ] Database migrations are created
- [ ] Prisma schema is up-to-date
- [ ] Connection pooling configured
- [ ] Error handling is comprehensive
- [ ] Logging is configured
- [ ] Health check endpoint exists
- [ ] API documentation is complete (if applicable)

### Frontend Specific
- [ ] Environment variables are using VITE_ prefix
- [ ] Production build succeeds
- [ ] Bundle size is acceptable
- [ ] Error boundaries are in place
- [ ] Loading states are handled
- [ ] API error handling is robust
- [ ] Form validation works

---

## Render Backend Deployment

### Pre-Deployment
- [ ] Backend builds locally: `npm run build`
- [ ] All environment variables are defined
- [ ] Database connection string is valid
- [ ] Prisma migrations are ready
- [ ] `render.yaml` is configured correctly
- [ ] GitHub repository is connected to Render

### During Deployment
- [ ] Monitor build logs in Render dashboard
- [ ] Verify all environment variables are set
- [ ] Confirm database is provisioned
- [ ] Check build completes successfully
- [ ] Verify service starts without errors

### Post-Deployment
- [ ] Service is running and healthy
- [ ] Health check endpoint responds
  ```bash
  curl https://pitcrew-api.onrender.com/api/health
  ```
- [ ] Database connection is active
- [ ] Logs show no errors
- [ ] Multiple rapid deployments work (test redeploy)

---

## Vercel Frontend Deployment

### Pre-Deployment
- [ ] Frontend builds locally: `npm run build`
- [ ] All VITE_ environment variables are defined
- [ ] `VITE_BACKEND_URL` points to Render backend
- [ ] No TypeScript errors or warnings
- [ ] Build bundle size is acceptable

### During Deployment
- [ ] Monitor deployment progress in Vercel
- [ ] Verify build completes successfully
- [ ] Check all environment variables are injected
- [ ] Confirm deployment URL is accessible

### Post-Deployment
- [ ] Frontend loads in browser
- [ ] Pages render without errors
- [ ] API calls to backend succeed
- [ ] WebSocket connections work (if applicable)
- [ ] Browser console has no errors
- [ ] Network requests show 200 status codes

---

## Integration Testing

### API Connectivity
- [ ] Frontend can reach backend API
- [ ] CORS headers are correct
- [ ] API responses are processed correctly
- [ ] Error responses are handled

### Core Features
- [ ] User authentication/login works
- [ ] Intent creation works end-to-end
- [ ] Intent execution/triggering works
- [ ] Data persists in database
- [ ] Real-time updates work (if applicable)

### User Experience
- [ ] Loading screens display
- [ ] Error messages are user-friendly
- [ ] Form validation provides helpful feedback
- [ ] Navigation works correctly
- [ ] Responsive design works on mobile

---

## Monitoring & Observability

### Logs
- [ ] Render logs accessible and readable
- [ ] Vercel logs accessible and readable
- [ ] No error spam in logs
- [ ] Error messages are actionable

### Performance
- [ ] API response times are acceptable
- [ ] Frontend performance metrics are good
- [ ] Database queries are optimized
- [ ] No memory leaks detected

### Errors
- [ ] Error tracking is configured (optional)
- [ ] Critical errors trigger alerts (optional)
- [ ] Error logs are archived

---

## Database

### Migrations
- [ ] All migrations have run successfully
- [ ] Database schema matches Prisma schema
- [ ] Indexes are created for performance
- [ ] Foreign keys are correct

### Data
- [ ] Initial seed data (if needed) is loaded
- [ ] No test data in production
- [ ] Backup strategy is in place

### Performance
- [ ] Connection pooling is enabled
- [ ] Query performance is acceptable
- [ ] Database size is monitored

---

## Security Checklist

### API Security
- [ ] Authentication is required for sensitive endpoints
- [ ] Authorization checks are enforced
- [ ] Rate limiting is configured
- [ ] Input validation is implemented
- [ ] SQL injection is prevented (using Prisma ORM)
- [ ] CORS is restrictive (not allowing *)
- [ ] HTTPS only (no HTTP)

### Environment Variables
- [ ] No secrets are hardcoded
- [ ] All sensitive vars are in Render/Vercel settings
- [ ] Local `.env` is in `.gitignore`
- [ ] Production URL uses HTTPS

### Dependencies
- [ ] No known vulnerabilities: `npm audit`
- [ ] Dependencies are from trusted sources
- [ ] Lock file (`package-lock.json`) is committed

---

## Documentation

### For Developers
- [ ] README.md is up-to-date
- [ ] DEPLOYMENT.md is complete
- [ ] Code comments explain complex logic
- [ ] API endpoints are documented

### For Operations
- [ ] Environment variable guide exists
- [ ] Troubleshooting guide is available
- [ ] Monitoring instructions are clear
- [ ] Rollback procedure is documented

---

## DNS & Domains (If Applicable)

### Custom Domains
- [ ] Domain is registered
- [ ] SSL certificates are issued
- [ ] DNS records are pointing correctly
- [ ] Domain works in browser

### Verification
- [ ] Custom domain resolves to backend
- [ ] Custom domain resolves to frontend
- [ ] HTTPS works on custom domains

---

## Final Verification

### Test Complete User Flow
- [ ] User can sign up/login
- [ ] User can create an intent
- [ ] Intent conditions are evaluated
- [ ] Intent executes when triggered
- [ ] User sees results/notifications
- [ ] No data is lost or corrupted

### Load Testing (Optional)
- [ ] API handles normal concurrent users
- [ ] Frontend performance is acceptable
- [ ] Database doesn't timeout
- [ ] No crashes under load

### Backup & Recovery
- [ ] Database backups are working
- [ ] Backup retention is set correctly
- [ ] Restore procedure has been tested

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Developer | _____ | _____ | ☐ |
| QA/Tester | _____ | _____ | ☐ |
| DevOps | _____ | _____ | ☐ |
| Product Owner | _____ | _____ | ☐ |

---

## Post-Deployment Monitoring (First 24 Hours)

- [ ] Monitor error rates (should be <1%)
- [ ] Check performance metrics
- [ ] Verify backups are running
- [ ] Check server resource usage
- [ ] Review all logs for issues
- [ ] Confirm users can access application

---

## Notes

Use this space to document any issues, workarounds, or special configurations during deployment:

```
[Your notes here]
```

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Notes:** _______________
