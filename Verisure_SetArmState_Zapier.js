const USERNAME = 'TODO: Add your user name';
const PASSWORD = 'TODO: Add your password';
const CODE = 'TODO: Add your PIN code';
const STATE = 'TODO: Add the desired state'; // 'DISARMED' / 'ARMED_AWAY' / 'ARMED_HOME'

// Installations can be queried using '{BASE_URL}/installation/search?email={USERNAME}':
const INSTALLATION_ID = 'TODO: Add the installation id';

const BASE_URL = 'https://e-api01.verisure.com/xbn/2'; // 'https://e-api02.verisure.com/xbn/2'
const POST_LOGIN_URL = BASE_URL + '/cookie';
const PUT_ARM_STATE_URL = BASE_URL + '/installation/' + INSTALLATION_ID + '/armstate/code';
const GET_ARM_STATE_RESULT_URL = BASE_URL + '/installation/' + INSTALLATION_ID + '/code/result/';
const TRANSACTION_DELAY_IN_MS = 5000;

console.log('Calling POST login');

// Start by logging in:
fetch(POST_LOGIN_URL,
    {
        method: 'POST',
        headers: {
            'Accept': 'application/json,text/javascript, */*; q=0.01',
            'Authorization': 'Basic ' + new Buffer('CPE/' + USERNAME + ':' + PASSWORD).toString('base64')
        }
    })
    .then(function (response) { return response.json(); })
    .then(function (loginResponse) {

        if (loginResponse.cookie == null) {
            callback(null,
            {
                'success': false,
                'message': 'POST login was unsuccessful: ' + JSON.stringify(loginResponse)
            });
            return;
        }
        var cookieHeader = 'vid=' + loginResponse.cookie;

        console.log('Calling PUT arm state: ' + STATE);

        // If login is successful, try to set the arm state:
        fetch(PUT_ARM_STATE_URL,
            {
                method: 'PUT',
                body: JSON.stringify({ 'code': CODE, 'state': STATE }),
                headers: {
                    'Accept': 'application/json,text/javascript, */*; q=0.01',
                    'Cookie': cookieHeader,
                    'Content-Type': 'application/json'
                }
            })
            .then(function (response) { return response.json(); })
            // Wait for the transaction to complete before checking the result:
            .then(args => new Promise(resolve => setTimeout(() => resolve(args), TRANSACTION_DELAY_IN_MS)))
            .then(function (armStateResponse) {

                if (armStateResponse.armStateChangeTransactionId == null) {
                    callback(null,
                    {
                        'success': false,
                        'message': 'PUT arm state was unsuccessful: ' + JSON.stringify(armStateResponse)
                    });
                    return;
                }

                console.log('Calling GET transaction result');

                // Check if the transaction was successful:
                fetch(GET_ARM_STATE_RESULT_URL + armStateResponse.armStateChangeTransactionId,
                    {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json,text/javascript, */*; q=0.01',
                            'Cookie': cookieHeader
                        }
                    })
                    .then(function (response) { return response.json(); })
                    .then(function (transactionResponse) {

                        if ((transactionResponse.result == null) || (transactionResponse.result != 'OK')) {
                            callback(null,
                            {
                                'success': false,
                                'message': 'Arm state transaction was unsuccessful: ' + JSON.stringify(transactionResponse)
                            });
                            return;
                        }

                        callback(null,
                        {
                            'success': true,
                            'message': transactionResponse.result
                        });
                    })
                    .catch(function (error) {
                        callback(null,
                        {
                            'success': false,
                            'message': 'Getting transaction result failed: ' + error
                        });
                    });
            })
            .catch(function (error) {
                callback(null,
                {
                    'success': false,
                    'message': 'Setting alarm state to ' + STATE + ' failed: ' + error
                });
            });
    })
    .catch(function (error) {
        callback(null,
        {
            'success': false,
            'message': 'Login failed: ' + error
        });
    });
