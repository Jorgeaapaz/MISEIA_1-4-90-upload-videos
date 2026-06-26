// Jest global setup — runs before each test file
process.env.JWT_SECRET = 'test-secret-for-unit-tests-32chars!!';
process.env.MONGODB_URI = 'mongodb://localhost:27017';
process.env.MONGODB_DB = 'videovault_test';
process.env.RUSTFS_ENDPOINT = 'http://localhost:10000';
process.env.RUSTFS_ACCESS_KEY = 'testkey';
process.env.RUSTFS_SECRET_KEY = 'testsecret';
process.env.RUSTFS_BUCKET = 'videos';
