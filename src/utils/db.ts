import mysql from 'mysql2/promise';

const db = {
  async query(sql: string, params?: any[]) {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'newmutasi',
      charset: 'utf8mb4'
    });
    
    try {
      const result = await connection.execute(sql, params);
      return result;
    } finally {
      await connection.end();
    }
  }
};

export default db;