# Open source social network MEXY.PRO

<div style="text-align:center;background:white;"><img src="https://raw.githubusercontent.com/UABRO/mexy-frontend/master/public/img/logo.png" style="max-height:200px"></div>

## How to create something [#moreThanFacebook](https://mexy.pro) ?

Use new approach.

Now, with `Mexy`, users not just create and share content within frames of website,
but they can modify and extend the rules governing those processes.

Now, users can define their virtual environment: both functionality and design.

Propose your changes via `Pull Requests` (PR) and enjoy it on [mexy.pro](https://mexy.pro)

## Steps to launch application:

> Note
>* This repository contains latest source code only for backend part of `Mexy`.
>* Frontend part is here - https://github.com/UABRO/mexy-frontend

1) Download source code
```bash
# create directory for the whole Mexy project
mkdir mexy-project
cd mexy-project

# download backend part
git clone https://github.com/UABRO/mexy.git mexy-backend

# download frontend part
git clone https://github.com/UABRO/mexy-frontend.git

# create directory for configuration files
mkdir data
```

> now you should have similar directory structure
> - .../mexy-project/
>  - data/
>  - mexy-backend/
>  - mexy-frontend/

2) Setup configuration (see `config.js` and `config-sample.js` files).

```bash
cd data
touch config-frontend.js
touch config-backend.js

# fill these files with data from `config-sample.js` from appropriate repository
```

3) Install dependencies

```bash
cd mexy-backend
npm i

# install global dependencies
npm i nodemon -g
```

4) Install `MongoDB`
> https://docs.mongodb.com/manual/administration/install-community/

5) Start server

```bash
# if database not running, start it
mongod

# then, actually the server
npm run nodemon
```

And you should see something like this:

```bash
Functions API ready
Database API ready
Server running at http://192.168.0.101:8777
Server running at http://localhost:8777
```

Backend for Mexy is up and running!

Launch frontend server if it's not running yet
> https://github.com/UABRO/mexy-frontend

## Contributing

Join our community of developers to improve Mexy above the sky!

Learn and shape best practices of programming with professionals and talented people from all over the world.

Read more at [CONTRIBUTING.md](https://github.com/UABRO/mexy/blob/master/CONTRIBUTING.md)