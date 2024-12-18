const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
      encrypt: true, // Use encryption
      enableArithAbort: true,
      //connectionTimeout: 5000, // 5 seconds
    },
    // pool: {
    //   max: 10,
    //   min: 0,
    //   idleTimeoutMillis: 30000 // 30 seconds
    // }
  };
  
  export default config;