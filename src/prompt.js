const { ApiPromise, WsProvider } = require('@polkadot/api');
const fs = require('fs');
const bluebird = require('bluebird');
const { chainAddr, seedsPath } = require('./consts');
const { hexToString, sendTx, parseObj } = require('./util');

module.exports = {
  default: async (msg) => {
    try {
      // 1. Try connect to Magnet Network
      const chain = new ApiPromise({
        provider: new WsProvider(chainAddr),
      });
      await chain.isReadyOrError;

      // 2. Load seeds info
      const seeds = fs.readFileSync(seedsPath, 'utf8');

      // 3. Send place storage order tx
      const tx = chain.tx.ai.ask(msg);
      const nonce = await sendTx(tx, seeds);
      if (nonce !== -1) {
        //console.log(`Prompt ${msg} success`)
        console.log(`⛓  Success, you can wait or quit and use 'npx magnet-cli status ${nonce}' to check answer...`)
        do {
          await bluebird.delay(3000);
          const ans = parseObj(await chain.query.ai.replyRecords(nonce));
          if (ans !== '0x') {
            console.log(hexToString(ans));
            break;
          }
        } while (true);
      } else {
        console.error('Prompt failed with \'Send transaction failed\'')
      }

      // 4. Disconnect with chain
      chain.disconnect();
    } catch (e) {
      console.error(`Publish failed with: ${e}`);
    }
  }
}
