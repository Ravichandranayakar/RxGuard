## 1. Clone the repository
git clone <REPOSITORY-URL>

## 2. Enter the project
cd RxGuard

## 3. Check the current branch
git branch

## 4. Switch to main
git switch main

## 5. Get the latest main
git pull origin main

## 6. Create your feature branch
git switch -c feature/<your-feature>

## Example:
git switch -c feature/backend

## 7. Check your branch
git branch

## 8. Work on your feature...

## 9. Check your changes
git status

## 10. Review your changes
git diff

## 11. Stage changes
git add .

## 12. Commit
git commit -m "feat: add prescription verification API"

## 13. Push your branch
git push -u origin feature/backend

## 14. Create a Pull Request on GitHub
## feature/backend → main

## 15. After the PR is merged, update your local main
git switch main
git pull origin main

## 16. Create your next feature branch
git switch -c feature/<next-feature>