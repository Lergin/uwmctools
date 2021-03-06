const config = require( '../config.json' );

const Request = require( './Request' );
const uuidlockup = require( '../uuid' );
const UwmcPlayer = require( '../player/UwmcPlayer' );
const Helper = require('../Helper');


/**
 * request to get the data about players from the playerlist of the webpage of uwmc.de and does the work to convert it
 * and save it to the database
 */
class PlayerListRequest extends Request {
    /**
     * creates a new PlayerListRequest
     */
    constructor() {
        super( config.URLS.UWMC.PLAYERLIST );
    }

    /**
     * executes the request, converts the data and saves it to the DB
     * @return {Promise} result of the database query
     */
    execute() {
        let req = this;

        return super.execute().then( function ( res ) {
            // convert it to an key -> value object so we can get a list of the names with Object.keys and can get the
            // data of a specific player without iterating throug the array
            req._lastResponse = Helper.convertToMap( res.body.data, 'playerName' );

            return req.lastResponse;
        } ).then( function( players ) {
           // get the uuids and names in correct capitalization
            return uuidlockup.getUuids( [...players.keys()] ).then( function ( res ) {
                // array of all the Promises needed to save the data of all players, so it's possible to resolve the
                // current Promise after all are finished
                let uwmcPlayers = [];

                for ( let player of res.values() ) {
                    let p = new UwmcPlayer(player.uuid);
                    p.name = player.name;
                    uwmcPlayers.push(
                        PlayerListRequest._addPlayerListDataToPlayer(p, players.get(player.name.toLowerCase())));
                }
                return uwmcPlayers;
            } );
        } );
    }

    /**
     * the last response of the request (unconverted to player objects)
     * @type {Object}
     * @readonly
     */
    get lastResponse() {
        return this._lastResponse;
    }

    /*
     * adds the data we get from the request to the player object
     */
    static _addPlayerListDataToPlayer(player, data) {
        player.lastPlayed = new Date();

        let newRank = data.priority;
        if ( player.rank != newRank ) {
            player.rank = newRank;
            player.addRankChange( newRank, new Date() );
        }

        player.boardId = data.boardId;

        return player;
    }
}

module.exports = PlayerListRequest;
