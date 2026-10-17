#!/usr/bin/env node
import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password || password.length < 10) {
  console.error('Password must be at least 10 characters.');
  process.exit(1);
}

const salt = bcrypt.genSaltSync(12);
const hash = bcrypt.hashSync(password, salt);
console.log(hash);
