// Core modules
import { Request, Response, Next } from 'express';

const bcrypt = require('bcrypt');
const session = require('express-session');
const express = require('express');
const path = require('path');
const passport = require('passport');
const methodOverride = require('method-override');
const { Sequelize, DataTypes, UUID, UUIDV4 } = require('sequelize');
const passportLocal = require('passport-local');
const sequelize = new Sequelize(
  'postgres://postgres:semeolvido@127.0.0.1:5432/passport'
);
const app = express();
const port = process.env.port || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'Secret session',
    saveUninitialized: false,
    resave: false,
  })
);
app.use(methodOverride('_method'));

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new passportLocal(async (username, passsword, done) => {
    const user = await User.findOne({ where: { username: username } });
    /*     if (!user) {
            console.log('usuario no encontrado');
            return done(null, false);
        }
        if (user.dataValues.password !== passsword) {
            //console.log(hash);
            console.log('Mal contraseña')
            return done(null, false)
        }
        return done(null, user) */

    //CON BCRYPT
    if (!user) {
      return done(null, false);
    }
    await bcrypt.compare(passsword, user.dataValues.password, (err, result) => {
      if (result) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((_id, done) => {
  done(null, _id);
});

const User = sequelize.define(
  'userpp',
  {
    id: {
      type: UUID,
      defaultValue: UUIDV4,
      allowNull: false,
      unique: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
    },
  },
  {
    freezeTableName: true,
  }
);

const isAutehticated = (req: Request, res: Response, next: Next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('login');
};

const isNotAuthenticated = (req: Request, res: Response, next: Next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('secret');
};

//To create database and table with all columns RUN FIRST

app.get('/sync', async (req: Request, res: Response) => {
  await sequelize.sync({ force: true });
  res.send('Database Created');
});

app.get(
  '/secret',
  isAutehticated,
  async (req: Request, res: Response, next: Next) => {
    res.render('secret');
  }
);

app.get(
  '/login',
  isNotAuthenticated,
  (req: Request, res: Response, next: Next) => {
    res.render('login');
  }
);

app.post(
  '/login',
  passport.authenticate('local'),
  async (req: Request, res: Response, next: Next) => {
    res.redirect('/secret');
  }
);

app.get(
  '/register',
  isNotAuthenticated,
  (req: Request, res: Response, next: Next) => {
    res.render('register');
  }
);

app.post('/register', async (req: Request, res: Response, next: Next) => {
  const { username = '', password = '' } = req.body;
  if (username == '' || password == '') {
  } else {
    const hash = await bcrypt.hash(password, 12);
    const createdUser = await User.create({
      username: username,
      password: hash,
    });
    req.login(createdUser, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect('/secret');
    });
  }
});

/* app.get('/bcrypt', (req, res, next) => {
    res.render('bcrypt');
});

app.post('/bcrypt', async (req, res, next) => {
    const { username, password } = req.body;
    const findUser = await User.findOne({ where: { username: username } });
    if (!findUser) {
        return res.send('Usuario no encontrado');
    }
    const findUserPass = findUser.dataValues.password;
    await bcrypt.compare(password, findUserPass, (err, result) => {
        if (result) {
            res.send('LOGEADO');
        } else {
            res.send('MAL');
        }
    })
}); */

app.delete('/logout', async (req: Request, res: Response, next: Next) => {
  const logOut = () => {
    req.logOut();
  };
  logOut();
  res.redirect('login');
});

app.listen(port, () => {
  console.log(`Running at port: ${port}`);
});
