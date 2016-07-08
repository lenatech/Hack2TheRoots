var login = require('facebook-chat-api');
var rnv_api = require('./src/index.js');

var users_position = new Array();
var rnv = new rnv_api();

login({email: '', password: ''}, function callback (err, api) {
    if(err)
        return console.error(err);

    api.listen(function callback(err, message) {
        if (message.attachments[0]) {
            type = message.attachments[0].type;
            if (type == 'sticker') {
                transportation_stickers = ['665073523504168', '210852145739487', '209575122566323', '210852145739487', '567099163388580'];
                msg = {sticker: transportation_stickers[Math.floor(Math.random() * transportation_stickers.length)]};

                api.sendMessage(msg, message.threadID);
            } else if (type == 'share') {
                position_url = message.attachments[0].facebookUrl;

                pattern = /where1=(.*)%2C\+(.*)&FORM/;
                position = pattern.exec(position_url);

                users_position[message.senderID] = [position[1], position[2]];

                api.sendMessage('OK, now I got you. :)', message.threadID);
            } else {
                api.sendMessage('I don\'t want to be straight, but... you look so sorry. :P', message.threadID);
            }
        } else {
            if (message.body.match(/news/i)) {
                rnv.news(function(news){
                    for(n in news) {
                        api.sendMessage(news[n].dateAsString + '\n' + news[n].title, message.threadID);
                    }
                    api.sendMessage('For more information, please go to https://www.rnv-online.de/aktuelles.html .', message.threadID);
                });

            } else if (message.body.match(/live/i)) {
                rnv.ticker(function (live_info) {
                    api.sendMessage(live_info[0].dateAsString + '\n' + live_info[0].title, message.threadID);
                });

            } else if (message.body.match(/nearest/i)) {
                if (users_position[message.senderID]) {
                    min = Number.MAX_VALUE;
                    station_name = '';
                    latitude = 0;
                    longitude = 0;

                    rnv.stations(function (station_infos) {
                        for (s in station_infos.stations) {
                            distance = Math.pow(station_infos.stations[s].latitude - users_position[message.senderID][0], 2) + Math.pow(station_infos.stations[s].longitude - users_position[message.senderID][1], 2);
                            if (distance < min) {
                                min = distance;
                                station_name = station_infos.stations[s].longName;
                                latitude = station_infos.stations[s].latitude;
                                longitude = station_infos.stations[s].longitude;
                            }
                        }
                        api.sendMessage('Seems that you are close to ' + station_name + ' station.', message.threadID);
                        api.sendMessage('https://maps.here.com/directions/mix/Your-Location:' + users_position[message.senderID][0].toString() + ',' + users_position[message.senderID][1].toString() + '/' + station_name + ':' + latitude.toString() + ',' + longitude.toString(), message.threadID);

                        if (min > 10) {
                            api.sendMessage('By the way, are you sure you are in Germany?', message.threadID);
                        }
                    });

                } else {
                    api.sendMessage('Sorry, but did you share your location with me?', message.threadID);
                }
            } else if (message.body.match(/to /i)) {
                if (users_position[message.senderID]) {
                    ask_route = false;
                    station_name_des = '';
                    latitude_des = 0;
                    longitude_des = 0;
                    min_ld = Number.MAX_VALUE;
                    guess_name = '';

                    rnv.stations(function (station_infos) {
                        for (s in station_infos.stations) {
                            if (message.body.indexOf(station_infos.stations[s].longName) > -1) {
                                ask_route = true;
                                station_name_des = station_infos.stations[s].longName;
                                latitude_des = station_infos.stations[s].latitude;
                                longitude_des = station_infos.stations[s].longitude;
                                break;
                            } else {
                                var m = new Array();

                                for (i = 0; i < station_infos.stations[s].longName.length + 1; i++) {
                                    m[i] = new Array();
                                    for (j = 0; j < message.body.length + 1; j++) {
                                        m[i][j] = 0;
                                    }
                                }

                                for (i = 0; i < station_infos.stations[s].longName.length + 1; i++) {
                                    m[i][0] = i;
                                }

                                for (j = 0; j < message.body.length + 1; j++) {
                                    m[0][j] = j;
                                }

                                for (i = 1; i < station_infos.stations[s].longName.length + 1; i++) {
                                    for (j = 1; j < message.body.length + 1; j++) {
                                        if (station_infos.stations[s].longName[i - 1] == message.body[j - 1])
                                            m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1]);
                                        else
                                            m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + 1);

                                    }
                                }
                                if (m[station_infos.stations[s].longName.length][message.body.length] < min_ld && m[station_infos.stations[s].longName.length][message.body.length] < (message.body.length - station_infos.stations[s].longName.length + 2)) {
                                    min_ld = m[station_infos.stations[s].longName.length][message.body.length];
                                    guess_name = station_infos.stations[s].longName;
                                }

                            }
                        }

                        if (ask_route == true) {
                            min = Number.MAX_VALUE;
                            station_name = '';
                            latitude = 0;
                            longitude = 0;

                            rnv.stations(function (station_infos) {
                                for (s in station_infos.stations) {
                                    distance = Math.pow(station_infos.stations[s].latitude - users_position[message.senderID][0], 2) + Math.pow(station_infos.stations[s].longitude - users_position[message.senderID][1], 2);
                                    if (distance < min) {
                                        min = distance;
                                        station_name = station_infos.stations[s].longName;
                                        latitude = station_infos.stations[s].latitude;
                                        longitude = station_infos.stations[s].longitude;
                                    }
                                }

                                api.sendMessage('https://maps.here.com/directions/mix/The-nearest-station-to-you:' + latitude.toString() + ',' + longitude.toString() + '/' + station_name_des + ':' + latitude_des.toString() + ',' + longitude_des.toString(), message.threadID);

                            });

                        } else {
                            if (min_ld < Number.MAX_VALUE) {
                                api.sendMessage('Hmm ... Did you mean ' + guess_name + '?', message.threadID);
                            } else {
                                api.sendMessage('Oh by the way, I am wondering if you know that they already made a game of me. ;)\nhttp://kindersung.github.io/flappy/', message.threadID);
                            }
                        }
                    });

                } else {
                    api.sendMessage('Sorry, but did you share your location with me?', message.threadID);
                }
            } else if (message.body.match(/bored/i)) {
                api.sendMessage('I am wondering if you know that they already made a game of me. ;)\nhttp://kindersung.github.io/flappy/', message.threadID);
            } else {
                api.sendMessage('Good... Good..... Oh by the way, I am wondering if you know that they already made a game of me. ;)\nhttp://kindersung.github.io/flappy/', message.threadID);
            }
        }
    });
});
