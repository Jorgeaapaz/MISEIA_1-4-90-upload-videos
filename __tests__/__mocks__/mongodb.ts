// Mock for lib/mongodb.ts
const mockCollection = {
  findOne: jest.fn(),
  insertOne: jest.fn(),
  find: jest.fn(() => ({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue([]),
  })),
  countDocuments: jest.fn().mockResolvedValue(0),
  deleteOne: jest.fn(),
  createIndex: jest.fn(),
};

const mockDb = {
  collection: jest.fn(() => mockCollection),
};

export const getDb = jest.fn().mockResolvedValue(mockDb);
export const ensureIndexes = jest.fn().mockResolvedValue(undefined);

export { mockDb, mockCollection };
