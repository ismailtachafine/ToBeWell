const portfinder = require('portfinder');

portfinder.getPort({ port: 5000 }, (err, port) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log(`Port ${port} is available`);
  }
});
