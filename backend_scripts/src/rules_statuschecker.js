const firebase = require('firebase-admin');
const UwmcTools = require('uwmctools');
const PushService = require(__dirname + '/pushservice.js');

(async function() {
    firebase.initializeApp({
        credential: firebase.credential.cert(__dirname + '/firebase_credentials.json'),
        databaseURL: 'https://dashboard-196e4.firebaseio.com',
    });

    const db = firebase.database();
    const ref = db.ref('uwmctools/rules');

    const uwmcTool = new UwmcTools('');

    const data = await uwmcTool.getRuleData();

    const oldRules = await ref.once('value');

    if(oldRules.val() !== data) {
        ref.set(data);
        PushService.push('/topics/UWMC_RULE_UPDATE', {
            'title': 'Regeländerung UWMC',
            'body': 'Es gab eine Änderung der Regeln von UnlimitedWorld.de',
            'click_action': 'https://uwmc.de/rules',
        });
    }
})();

setTimeout(() => process.exit(), 60000);