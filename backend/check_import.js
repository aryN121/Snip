(async ()=>{
  try {
    await import('./src/app.js');
    console.log('IMPORT_OK');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();