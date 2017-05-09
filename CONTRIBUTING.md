# Contribution Guidelines

Fork original Mexy repository to your GitHub account.

```bash
# then, git clone it
git clone https://github.com/yourUserName/mexy.git

# set your upstream to the original mexy repository
git remote add upstream https://github.com/UABRO/mexy.git
```

Do not work `master` or `develop` branches.

```bash
# create your feature branch and name it to reflect the sense of work
git checkout -b feat-[name]
```

Make desired changes to Mexy's code.

```bash
# fetch all the branches including master from the original repository
# merge fetched data into your local master branch
# please, do this before each time you want to push your commits
git fetch upstream
git merge upstream/master

# push the changes to your forked repository i.e. to origin
git push origin/master
```

Go to [https://github.com/UABRO/mexy](https://github.com/UABRO/mexy) and make a `Pull Request` from your branch to `develop`. Be concise in describing your work.

## Branch naming convention:

* feat-[name] - for new feature development
* fix-[name] - for fixing issues and bugs

## Issue tracking

* If you see an issue or security lack, please describe it in details and refer your PR if needed: [issues](https://github.com/UABRO/mexy/issues)
