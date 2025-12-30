# Flood Aid Documentation - Maintainer's Checklist

## 📋 Quick Reference for Project Maintainers

Use this checklist to ensure documentation stays current and helpful.

---

## Pre-Release Documentation Checklist

### Code Changes
- [ ] All breaking changes documented
- [ ] New API endpoints added to [API_DOCS.md](API_DOCS.md)
- [ ] New database tables in [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
- [ ] New DTOs in [DTOS_AND_MODELS.md](DTOS_AND_MODELS.md)
- [ ] Deployment changes in [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- [ ] Configuration changes documented

### Documentation Review
- [ ] Code examples tested and working
- [ ] API examples match actual endpoints
- [ ] Database schema matches migrations
- [ ] Error codes up to date
- [ ] Status codes correct
- [ ] Links all functional

### Quality Assurance
- [ ] No formatting errors
- [ ] Consistent terminology used
- [ ] Clear and concise writing
- [ ] Examples are practical and complete
- [ ] Tables properly formatted
- [ ] Code blocks properly highlighted

### User-Facing Features
- [ ] [user_docs.md](user_docs.md) updated if UX changed
- [ ] Screenshots updated if UI changed
- [ ] User workflows documented

### Testing Documentation
- [ ] Test instructions clear
- [ ] Test data examples provided
- [ ] Expected results documented
- [ ] Common test scenarios covered

---

## Monthly Documentation Maintenance

### Week 1: Review & Update
- [ ] Review last month's changes
- [ ] Identify missing documentation
- [ ] Check for outdated content
- [ ] Fix broken links

### Week 2: Code Examples
- [ ] Run all code examples locally
- [ ] Verify they work as documented
- [ ] Update any that changed
- [ ] Test error scenarios

### Week 3: Accuracy Check
- [ ] Verify API endpoints still accurate
- [ ] Check database schema matches code
- [ ] Confirm deployment procedures current
- [ ] Review error codes

### Week 4: Team Feedback
- [ ] Gather feedback from developers
- [ ] Identify confusing sections
- [ ] Plan improvements
- [ ] Update based on common questions

---

## Feature Release Checklist

### Before Code Review
- [ ] Update relevant documentation files
- [ ] Add to [DOCUMENTATION_SUMMARY.md](DOCUMENTATION_SUMMARY.md) change log
- [ ] Include docs changes in PR description

### Before Merge
- [ ] Documentation reviewed for accuracy
- [ ] Examples tested
- [ ] Links verified
- [ ] Formatting checked

### Before Deployment
- [ ] Update [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) if needed
- [ ] Update environment variable list
- [ ] Update security checklist if applicable
- [ ] Update monitoring/alerting docs

### After Deployment
- [ ] Verify all links work in production docs
- [ ] Test API examples against live API
- [ ] Update live URL references if changed
- [ ] Announce changes to team

---

## Documentation Audit Checklist (Quarterly)

### Completeness Check
- [ ] All public APIs documented
- [ ] All database tables documented
- [ ] All major features have examples
- [ ] Troubleshooting section comprehensive
- [ ] Deployment fully documented

### Accuracy Check
- [ ] Endpoints match code
- [ ] Database schema matches models
- [ ] Error codes are real and current
- [ ] HTTP status codes correct
- [ ] Configuration keys exist

### Quality Check
- [ ] Writing is clear and concise
- [ ] Examples are practical
- [ ] No outdated information
- [ ] Consistent terminology
- [ ] Proper formatting

### User Experience Check
- [ ] Easy to find information
- [ ] Good cross-referencing
- [ ] Clear navigation
- [ ] Appropriate detail level
- [ ] Helpful examples

---

## Common Updates by Type

### 🔧 Bug Fix Documentation
When fixing a bug:
- [ ] Add to troubleshooting section if user-facing
- [ ] Update workarounds if any
- [ ] Document root cause if helpful
- [ ] Update error documentation

### ✨ New Feature Documentation
When adding a feature:
- [ ] Create API endpoint documentation
- [ ] Add to database schema if needed
- [ ] Document DTOs/request models
- [ ] Add examples and workflows
- [ ] Update README features list
- [ ] Add troubleshooting section
- [ ] Update deployment guide if needed

### 🔄 Refactoring Documentation
When refactoring code:
- [ ] Verify API contract unchanged
- [ ] Check examples still valid
- [ ] Update error codes if changed
- [ ] Confirm database compatibility

### 🐛 Bug Fix in Docs
When fixing documentation:
- [ ] Verify fix against actual code
- [ ] Test examples if changed
- [ ] Update related sections
- [ ] Check cross-references
- [ ] Verify links

---

## Documentation Tools & Resources

### Verification Tools
- **Markdown Preview**: VS Code built-in
- **Link Checker**: Online tools or VS Code extensions
- **Spell Checker**: VS Code extensions
- **Code Formatter**: Prettier or Markdownlint

### Useful VS Code Extensions
```
Install these for better documentation:
- Markdown Preview Enhanced
- Markdownlint
- Code Spell Checker
- Better Comments
- GitLens (for history)
```

### Online Tools
- **Markdown Tables**: https://www.tablesgenerator.com/markdown_tables
- **ASCII Diagrams**: https://www.asciiflow.com
- **Link Validation**: https://www.w3cvalidator.com/checklink

---

## Documentation File Locations

### Main Documentation
```
docs/
├── INDEX.md                    ← Start here
├── README.md                   ← Project overview
├── system_docs.md             ← Architecture
├── user_docs.md               ← User guide
├── API_DOCS.md                ← API reference
├── DATABASE_SCHEMA.md         ← Data models
├── DEV_GUIDE.md               ← Development
├── DEPLOYMENT_GUIDE.md        ← Deployment
├── DTOS_AND_MODELS.md         ← Request/response
├── DOCUMENTATION_SUMMARY.md   ← This project summary
└── MAINTAINER_CHECKLIST.md    ← This checklist
```

### Code Documentation
- **Backend**: XML comments in C# source
- **Frontend**: JSDoc comments in JavaScript

---

## Quick Reference: Which File to Update

| Change Type | Update File(s) |
| --- | --- |
| New API endpoint | API_DOCS.md, README.md |
| New database table | DATABASE_SCHEMA.md |
| New DTO | DTOS_AND_MODELS.md |
| Deployment change | DEPLOYMENT_GUIDE.md |
| Setup instruction | DEV_GUIDE.md |
| User feature | user_docs.md, README.md |
| Error/status code | API_DOCS.md, DEPLOYMENT_GUIDE.md |
| Environment variable | DEPLOYMENT_GUIDE.md, DEV_GUIDE.md |
| Bug fix | Troubleshooting section |
| Security update | DEPLOYMENT_GUIDE.md, system_docs.md |

---

## Documentation Health Indicators

### Good Signs ✅
- Team asks fewer "where is X?" questions
- New developers onboard faster
- Fewer documentation-related PRs
- Users report helpful documentation
- Consistent documentation updates with code

### Warning Signs ⚠️
- Frequent questions about same topic
- Examples don't match actual code
- Broken links reported
- Outdated endpoints still documented
- Inconsistent information between docs

### Red Flags 🚨
- Documentation significantly out of date
- Examples fail when tested
- Critical features undocumented
- Users can't find answers
- Team avoids reading docs

---

## Common Issues & Solutions

### Issue: Documentation Out of Date
**Solution**: 
1. Schedule monthly review (add to calendar)
2. Run code examples regularly
3. Test API against documentation
4. Update found issues immediately

### Issue: Inconsistent Terminology
**Solution**:
1. Create glossary in documentation
2. Use consistent terms across all files
3. Search/replace during updates
4. Review PRs for terminology

### Issue: Examples Don't Work
**Solution**:
1. Test all examples before committing
2. Include in PR review process
3. Run examples against staging API
4. Version examples with API versions

### Issue: Hard to Find Information
**Solution**:
1. Improve INDEX.md navigation
2. Add cross-references
3. Use consistent headings
4. Implement search in documentation

### Issue: Outdated Screenshots
**Solution**:
1. Use descriptive text instead when possible
2. Update screenshots when UI changes
3. Add version numbers to screenshots
4. Consider using GIFs for workflows

---

## Documentation Release Notes Template

When documenting a release:

```markdown
# Release [Version] - [Date]

## New Features
- **Feature Name** - Description
  - [Link to API endpoint or feature doc]
  - [Example if applicable]

## Bug Fixes
- **Issue**: Description
- **Fix**: What was fixed
- [Link to troubleshooting if user-facing]

## Documentation Updates
- Added: [New documentation files]
- Updated: [Modified documentation files]
- Fixed: [Corrected documentation]

## Breaking Changes
- **Change**: Description of breaking change
- **Migration**: How to upgrade
- [Link to migration guide if complex]

## Deployment Notes
- [Any deployment process changes]
- [New environment variables]
- [Database migration required: Yes/No]

## Known Issues
- [Link to issue tracking]
- [Workarounds documented in: FILE.md]
```

---

## Documentation Glossary

### Common Terms (Use Consistently)

| Term | Definition | Context |
| --- | --- | --- |
| Donation | Cash or supply contribution | User-facing |
| Submission | Act of donating | Internal |
| Approval | Admin review completion | Internal |
| Receipt ID | GUID for donation tracking | API/User |
| Session | Stripe checkout session | API |
| OTP | One-time password | Authentication |
| JWT Token | Authentication credential | API |
| DTO | Data Transfer Object | Development |
| Migration | Database schema change | Development |

---

## Review Checklist for PRs with Docs

When reviewing a PR that includes documentation:

### Content
- [ ] Information is accurate
- [ ] Examples tested and working
- [ ] No spelling/grammar errors
- [ ] Technical accuracy verified

### Structure
- [ ] Proper heading hierarchy
- [ ] Clear organization
- [ ] Good cross-references
- [ ] Proper formatting

### Completeness
- [ ] All related docs updated
- [ ] Nothing left undocumented
- [ ] Examples cover common cases
- [ ] Edge cases mentioned

### Links
- [ ] All internal links valid
- [ ] All external links working
- [ ] No broken references
- [ ] Proper link formatting

---

## Documentation Governance

### Ownership
- **Overall**: Tech Lead
- **API Docs**: Backend Lead
- **Database**: Database Admin
- **Deployment**: DevOps Lead
- **User Docs**: Product Manager

### Approval
- Major changes: Tech Lead + relevant owner
- Minor fixes: Any developer
- User-facing: Product Manager

### Versioning
- Documentation version matches app version
- Maintained in separate release notes
- Archive old versions in folder

---

## Continuous Improvement

### Collect Feedback
- Slack channel: #documentation
- GitHub discussions
- Team surveys quarterly
- User feedback forms

### Track Metrics
- Documentation read-through times
- Time to answer support questions
- Documentation download counts
- User satisfaction scores

### Plan Updates
- Monthly improvement meeting
- Document common questions
- Address user feedback
- Plan new content

---

## Final Tips for Maintainers

1. **Keep it Fresh**: Review and update monthly
2. **Be Practical**: Examples should work
3. **Be Clear**: Use simple language
4. **Be Complete**: Cover edge cases
5. **Be Consistent**: Same terms, same style
6. **Be Linked**: Cross-reference when relevant
7. **Be Responsive**: Fix errors quickly
8. **Get Feedback**: Ask users what helps

---

## Resources

### Documentation Best Practices
- [Write the Docs](https://www.writethedocs.org/)
- [Google Technical Writing](https://developers.google.com/tech-writing)
- [Microsoft Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/)

### Markdown Resources
- [Markdown Guide](https://www.markdownguide.org/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)

### Project Documentation Examples
- [GitHub Help Documentation](https://docs.github.com)
- [Stripe API Documentation](https://stripe.com/docs)
- [React Documentation](https://react.dev/learn)

---

**Last Updated**: December 31, 2025  
**Version**: 1.0  
**Next Review**: January 31, 2026

---

## Appendix A: Quick Commands

### List all documentation files
```bash
ls -la docs/*.md | grep -v "^d"
```

### Search for term across docs
```bash
grep -r "search_term" docs/ --include="*.md"
```

### Validate markdown syntax
```bash
# Using markdownlint
npm install -g markdownlint
markdownlint docs/*.md
```

### Convert to HTML
```bash
# Using pandoc
pandoc docs/API_DOCS.md -o API_DOCS.html
```

### Check links
```bash
# Using markdown-link-check
npm install -g markdown-link-check
markdown-link-check docs/*.md
```

---

**Prepared by**: Flood Aid Documentation Team  
**For**: Flood Aid Project Maintainers  
**Use**: As continuous reference and checklist
