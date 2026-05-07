const supertest = require('supertest');
const { update } = require('lodash');
const app = require('../app');
const db = require('../db/connect-test');
const Company = require('../models/company');
const Entry = require('../models/entry');
const User = require('../models/user');
const { genereteAuthToken } = require('../helpers/auth');

const agent = supertest.agent(app);

jest.mock('../helpers/secrets.js');

let company1;
let company2;
let company3;

beforeAll(async () => await db.connect());
beforeEach(async () => {
  await db.clear();
  const Company1Creation = async () => {
    company1 = await new Company({
      name: 'Company1',
      pic: 'companypic',
      lang: 'EN',
      zipcode: '12345',
      country: 'IT',
      address: 'Via XYZ 123',
      phone: { prefix: '+39', number: '1234567890', country: 'IT' },
      type: 'type1',
      vatNumber: 'IT1234567890'
    }).save();
  };
  const Company2Creation = async () => {
    company2 = await new Company({
      name: 'Company2',
      pic: 'companypic2',
      lang: 'EN',
      zipcode: '1231245',
      country: 'IT',
      address: 'Via XYZ 123',
      phone: { prefix: '+39', number: '1234567890', country: 'IT' },
      type: 'type2',
      vatNumber: 'IT1234567890'
    }).save();
  };
  const Company3Creation = async () => {
    company3 = await new Company({
      name: 'Company3',
      pic: 'companypic3',
      lang: 'IT',
      zipcode: '1234345',
      country: 'EN',
      address: 'Via XYZ 123',
      phone: { prefix: '+39', number: '1234567890', country: 'IT' },
      type: 'type1',
      vatNumber: 'IT1234567890'
    }).save();
  };

  return Promise.all([Company1Creation(), Company2Creation(), Company3Creation()]);
});
afterEach(async () => await jest.clearAllMocks());
afterAll(async () => await db.close());

describe('Role: superadmin', () => {
  let token;
  let superuser;

  let entry1;
  let entry2;
  let entry3;
  beforeEach(async () => {
    const SuperuserCreation = async () => {
      superuser = await new User({
        name: 'Super',
        lastname: 'Admin',
        email: 'superuser@meblabs.com',
        password: 'testtest',
        roles: ['superuser'],
        active: true
      }).save();
      token = genereteAuthToken(superuser).token;
    };
    const Entry1Creation = async () => {
      entry1 = await new Entry({
        company: { id: company1.id, name: company1.name },
        user: { id: superuser.id, fullname: 'Super User' },
        description: 'Description1',
        type: 'income',
        amount: 100,
        date: new Date('2020-01-01')
      }).save();
    };
    const Entry2Creation = async () => {
      entry2 = await new Entry({
        company: { id: company2.id, name: company2.name },
        user: { id: superuser.id, fullname: 'Super User' },
        description: 'Description2',
        type: 'expense',
        amount: 50,
        date: new Date('2020-01-02')
      }).save();
    };
    const Entry3Creation = async () => {
      entry3 = await new Entry({
        company: { id: company2.id, name: company2.name },
        user: { id: superuser.id, fullname: 'Super User' },
        description: 'Description3',
        type: 'income',
        amount: 75,
        date: new Date('2020-01-03')
      }).save();
    };

    await SuperuserCreation();
    await Entry1Creation();
    await Entry2Creation();
    await Entry3Creation();
  });

  describe('GET /entries', () => {
    test('Get all entries', () =>
      agent
        .get('/entries')
        .set('Cookie', `accessToken=${token}`)
        .expect(200)
        .then(res =>
          expect(res.body).toStrictEqual([
            {
              _id: entry3.id,
              company: { id: company2.id, name: company2.name },
              description: 'Description3',
              type: 'income',
              amount: 75,
              date: expect.any(String),
              user: { id: superuser.id, fullname: 'Super User' },
              createdAt: expect.any(String),
              updatedAt: expect.any(String)
            },
            {
              _id: entry2.id,
              company: { id: company2.id, name: company2.name },
              description: 'Description2',
              type: 'expense',
              amount: 50,
              date: expect.any(String),
              user: { id: superuser.id, fullname: 'Super User' },
              createdAt: expect.any(String),
              updatedAt: expect.any(String)
            },
            {
              _id: entry1.id,
              company: { id: company1.id, name: company1.name },
              description: 'Description1',
              type: 'income',
              amount: 100,
              date: expect.any(String),
              user: { id: superuser.id, fullname: 'Super User' },
              createdAt: expect.any(String),
              updatedAt: expect.any(String)
            }
          ])
        ));
  });

  describe('POST /entries', () => {
    test('Create an entry for the current user', () =>
      agent
        .post('/entries')
        .set('Cookie', `accessToken=${token}`)
        .send({
          type: 'income',
          amount: 100,
          description: 'Description',
          date: new Date('2020-01-01')
        })
        .expect(201)
        .then(res =>
          expect(res.body).toStrictEqual({
            _id: expect.any(String),
            type: 'income',
            amount: 100,
            description: 'Description',
            date: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            user: { id: superuser.id },
            __v: 0
          })
        ));
    test('Create entry with invalid property', () =>
      agent
        .post('/entries')
        .set('Cookie', `accessToken=${token}`)
        .send({
          type: 'income',
          amount: 100,
          description: 'Description',
          date: new Date('2020-01-01'),
          wrongProperty: 'test'
        })
        .expect(400)
        .then(res =>
          expect(res.body).toStrictEqual({
            error: 202,
            message: 'Additional parameters are not permitted',
            data: '/wrongProperty'
          })
        ));
  });
  describe('PATCH /entries/:id', () => {
    test('Update an entry', () =>
      agent
        .patch(`/entries/${entry1.id}`)
        .set('Cookie', `accessToken=${token}`)
        .send({
          type: 'expense',
          amount: 150,
          description: 'Updated Description',
          date: new Date('2020-01-10')
        })
        .expect(200)
        .then(res =>
          expect(res.body).toStrictEqual({
            _id: entry1.id,
            company: { id: company1.id, name: company1.name },
            type: 'expense',
            amount: 150,
            description: 'Updated Description',
            date: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            user: { id: superuser.id, fullname: 'Super User' },
            __v: 0
          })
        ));
  });
  describe('DELETE /entries/:id', () => {
    test('Delete an entry', () =>
      agent
        .delete(`/entries/${entry1.id}`)
        .set('Cookie', `accessToken=${token}`)
        .expect(200)
        .then(() => expect(Entry.findById(entry1.id)).resolves.toBeNull()));
  });
  describe('GET /entries/:id', () => {
    test('Get an entry by id', () =>
      agent
        .get(`/entries/${entry1.id}`)
        .set('Cookie', `accessToken=${token}`)
        .expect(200)
        .then(res =>
          expect(res.body).toStrictEqual({
            _id: entry1.id,
            company: { id: company1.id, name: company1.name },
            description: 'Description1',
            type: 'income',
            amount: 100,
            date: expect.any(String),
            user: { id: superuser.id, fullname: 'Super User' },
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            __v: 0
          })
        ));
  });
});

describe('Role: admin', () => {
  let token;
  let admin;
  let admin2;
  let user;

  let entry1;
  let entry2;
  let entry3;
  beforeEach(async () => {
    const AdminCreation = async () => {
      admin = await new User({
        name: 'Admin',
        lastname: 'User',
        email: 'admin@meblabs.com',
        password: 'testtest',
        roles: ['admin'],
        company: { id: company1.id, name: company1.name, roles: ['admin'] },
        active: true
      }).save();
      token = genereteAuthToken(admin).token;
    };
    const AdminCreation2 = async () => {
      admin2 = await new User({
        name: 'Admin2',
        lastname: 'User',
        email: 'admin2@meblabs.com',
        password: 'testtest',
        roles: ['admin'],
        company: { id: company2.id, name: company2.name, roles: ['admin'] },
        active: true
      }).save();
    };
    const UserCreation = async () => {
      user = await new User({
        name: 'User',
        lastname: 'User',
        email: 'user@meblabs.com',
        password: 'testtest',
        roles: ['user'],
        company: { id: company1.id, name: company1.name },
        active: true
      }).save();
    };
    const Entry1Creation = async () => {
      // entry created by user for company1
      entry1 = await new Entry({
        user: { id: admin.id, fullname: 'Admin User' },
        company: { id: company1.id, name: company1.name },
        description: 'Description1',
        type: 'income',
        amount: 100,
        date: new Date('2020-01-01')
      }).save();
    };
    const Entry2Creation = async () => {
      // entry created by admin for company1
      entry2 = await new Entry({
        user: { id: user.id, fullname: 'User User' },
        company: { id: company1.id, name: company1.name },
        description: 'Description2',
        type: 'expense',
        amount: 50,
        date: new Date('2020-01-02')
      }).save();
    };
    const Entry3Creation = async () => {
      // entry created by admin2 for company2
      entry3 = await new Entry({
        user: { id: admin2.id, fullname: 'Admin2 User' },
        company: { id: company2.id, name: company2.name },
        description: 'Description3',
        type: 'income',
        amount: 75,
        date: new Date('2020-01-03')
      }).save();
    };

    await Promise.all([AdminCreation(), AdminCreation2(), UserCreation()]);
    await Promise.all([Entry1Creation(), Entry2Creation(), Entry3Creation()]);
  });

  describe('GET /entries', () => {
    test('Get admin entries', () =>
      agent
        .get('/entries')
        .set('Cookie', `accessToken=${token}`)
        .expect(200)
        .then(res =>
          expect(res.body).toStrictEqual([
            {
              _id: entry2.id,
              company: { id: company1.id, name: company1.name },
              description: 'Description2',
              type: 'expense',
              amount: 50,
              date: expect.any(String),
              user: { id: user.id, fullname: 'User User' },
              createdAt: expect.any(String),
              updatedAt: expect.any(String)
            },
            {
              _id: entry1.id,
              company: { id: company1.id, name: company1.name },
              description: 'Description1',
              type: 'income',
              amount: 100,
              date: expect.any(String),
              user: { id: admin.id, fullname: 'Admin User' },
              createdAt: expect.any(String),
              updatedAt: expect.any(String)
            }
          ])
        ));
  });

  describe('POST /entries', () => {
    test('Create an entry for the current user', () =>
      agent
        .post('/entries')
        .set('Cookie', `accessToken=${token}`)
        .send({
          type: 'income',
          amount: 100,
          description: 'Description',
          date: new Date('2020-01-01')
        })
        .expect(201)
        .then(res =>
          expect(res.body).toStrictEqual({
            _id: expect.any(String),
            type: 'income',
            amount: 100,
            description: 'Description',
            date: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            user: { id: admin.id },
            company: { id: company1.id, name: company1.name },
            __v: 0
          })
        ));
    test('Create entry with invalid property - fail', () =>
      agent
        .post('/entries')
        .set('Cookie', `accessToken=${token}`)
        .send({
          type: 'income',
          amount: 100,
          description: 'Description',
          date: new Date('2020-01-01'),
          wrongProperty: 'test'
        })
        .expect(400)
        .then(res =>
          expect(res.body).toStrictEqual({
            error: 202,
            message: 'Additional parameters are not permitted',
            data: '/wrongProperty'
          })
        ));
    test('Create entry for another company - fail', () =>
      agent
        .post('/entries')
        .set('Cookie', `accessToken=${token}`)
        .send({
          type: 'income',
          amount: 100,
          description: 'Description',
          date: new Date('2020-01-01'),
          company: { id: company2.id, name: company2.name }
        })
        .expect(400)
        .then(res =>
          expect(res.body).toStrictEqual({
            error: 202,
            message: 'Additional parameters are not permitted',
            data: '/company'
          })
        ));
  });
  describe('PATCH /entries/:id', () => {
    test('Update an entry', () =>
      agent
        .patch(`/entries/${entry1.id}`)
        .set('Cookie', `accessToken=${token}`)
        .send({
          type: 'expense',
          amount: 150,
          description: 'Updated Description',
          date: new Date('2020-01-10')
        })
        .expect(200)
        .then(res =>
          expect(res.body).toStrictEqual({
            _id: entry1.id,
            company: { id: company1.id, name: company1.name },
            type: 'expense',
            amount: 150,
            description: 'Updated Description',
            date: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            user: { id: admin.id, fullname: 'Admin User' },
            __v: 0
          })
        ));
  });
  describe('DELETE /entries/:id', () => {
    test('Delete an entry', () =>
      agent
        .delete(`/entries/${entry1.id}`)
        .set('Cookie', `accessToken=${token}`)
        .expect(200)
        .then(async () => {
          const entry = await Entry.findById(entry1.id);
          expect(entry).toBeNull();
        }));
  });
  describe('GET /entries/:id', () => {
    test('Get an entry by id, same company, same user - success', () =>
      agent
        .get(`/entries/${entry1.id}`)
        .set('Cookie', `accessToken=${token}`)
        .expect(200)
        .then(res =>
          expect(res.body).toStrictEqual({
            _id: entry1.id,
            company: { id: company1.id, name: company1.name },
            description: 'Description1',
            type: 'income',
            amount: 100,
            date: expect.any(String),
            user: { id: admin.id, fullname: 'Admin User' },
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            __v: 0
          })
        ));
    test('Get an entry by id, same company, different user - success', () =>
      agent
        .get(`/entries/${entry2.id}`)
        .set('Cookie', `accessToken=${token}`)
        .expect(200)
        .then(res =>
          expect(res.body).toStrictEqual({
            _id: entry2.id,
            company: { id: company1.id, name: company1.name },
            description: 'Description2',
            type: 'expense',
            amount: 50,
            date: expect.any(String),
            user: { id: user.id, fullname: 'User User' },
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            __v: 0
          })
        ));
    test('Get an entry by id, different company, different user - failure', () =>
      agent.get(`/entries/${entry3.id}`).set('Cookie', `accessToken=${token}`).expect(401));
  });
});
