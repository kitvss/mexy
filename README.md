# Open source social network MEXY.PRO

<div style="text-align:center;background:white;"><img src="https://raw.githubusercontent.com/UABRO/mexy/master/public/img/logo.png" style="max-height:200px"></div>

## How to create something #moreThanFacebook ?

Use new approach.

Now, with `Mexy`, users not just create and share content within frames of website,
but they can modify and extend the rules governing those processes.

Now, users can define their virtual environment: both functionality and design.

This repository contains latest source code for `Mexy`.

Propose your changes via `Pull Requests` (PR) and enjoy it on [mexy.pro](https://mexy.pro)

## Steps to launch application:

1) Clone repository
```git
git clone https://github.com/UABRO/mexy.git
```

2) Setup configuration (see `config.js` and `config-sample.js` files).

3) Install dependencies

```bash
npm i

# install global dependencies
npm i nodemon -g

# for development
npm i supervisor -g
```

3) Install `MongoDB`
> https://docs.mongodb.com/manual/administration/install-community/

4) Start `NodeJs` server with `nodemon`

```bash
nodemon
```

And you should see something like this

```bash
Functions API ready
db_api ready
Server running at http://127.0.0.2:80
Server also running at http://192.168.56.1:80
```

Open your browser at indicated URL and let's develop Mexy!

## Contributing

Join our community of developers to improve Mexy above the sky!

Learn and shape best practices of programming with professionals and talented people from all over the world.

Read more at [CONTRIBUTING.md](https://github.com/UABRO/mexy/blob/master/CONTRIBUTING.md)