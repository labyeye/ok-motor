(async ()=>{
  try{
    const gen = require('./backend/utils/generateBuyLetterPDF');
    const sample = {
      sellerName: 'Ram',
      sellerFatherName: 'Shyam',
      sellerCurrentAddress: 'Somewhere',
      vehicleName: 'Honda',
      vehicleModel: 'Activa',
      vehicleColor: 'Black',
      registrationNumber: 'BR01AB1234',
      chassisNumber: 'CH123',
      engineNumber: 'EN123',
      vehiclekm: 12345,
      buyerName: 'OK MOTORS',
      saleDate: new Date().toISOString(),
      todayDate: new Date().toISOString(),
      todayTime: '10:30',
      saleTime: '10:30',
      saleAmount: 50000
    };
    const buf = await gen(sample, true, 'hindi');
    const fs = require('fs');
    fs.writeFileSync('test-buy-output.pdf', buf);
    console.log('Wrote test-buy-output.pdf');
  }catch(e){
    console.error('Error generating buy PDF:', e);
    process.exit(1);
  }
})();
