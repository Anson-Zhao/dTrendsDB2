const axios = require('axios');
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const fs = require('fs');

const con = mysql.createConnection({
    host: '10.11.90.16',
    // host: '10.11.90.16',
    user: 'AppUser',
    password: 'Special888%',
    database: 'dtrends'
});
const transport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'aaaa.zhao@g.northernacademy.org',
        pass: 'qwer1234',
    },
});
const mailOptions = {
    from: 'aaaa.zhao@g.northernacademy.org',
    to: 'yumingxian7012@gmail.com; azhao@northernacademy.org',
    subject: 'Error Appearance From Covid Data Algorithm',
    html: 'Data can not insert.',
};

const Datalength = {
    from: 'aaaa.zhao@g.northernacademy.org',
    to: 'yumingxian7012@gmail.com; azhao@northernacademy.org',
    subject: 'Data Length incorrect',
    html: 'Data did not insert.',
};
const sqlconnection = {
    from: 'aaaa.zhao@g.northernacademy.org',
    to: 'yumingxian7012@gmail.com,azhao@northernacademy.org;',
    subject: 'SQL Disconnected',
    html: 'SQL Disconnected.',
};




let x = 0;
let waitTime = 5000;
let diflimit = 10;
let intervalTime = 24*60*60*1000;
let retryNum = 10;

console.log(intervalTime);

axiosReq();
setInterval(axiosReq, intervalTime);//make sure the function runs once per day


function axiosReq() {
    //check connection for mysql, if err,send notification
    con.connect(function (err) {
        if (err) {
            transport.sendMail(sqlconnection, (error, info) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log(`Message sent: ${info.response}`);
                }
            });
        } else {
            console.log("MySql Connected");
            //download data from OGC
            axios.get('https://demo.pygeoapi.io/covid-19/collections/cases/items?f=json&limit=10000')
                .then ((response) => {
                    let d = new Date();
                    let y = new Date(d);
                    y.setDate(y.getDate() - 1)
                    //get yesterday's date
                    let yesterday = y.getFullYear() + '-' + ("0" + (y.getMonth() + 1)).slice(-2) + '-' + ("0" + y.getDate()).slice(-2);
                    let countcheck = "SELECT COUNT(LayerName) AS rowscount FROM dtrends.covid_19 WHERE Date = ?;"
                    con.query(countcheck, [yesterday], async function  (err, count) {//check data length
                        let countryN;
                        let pointNum = parseFloat(count[0].rowscount);
                        let dif = response.data.features.length - pointNum;
                        //if the absolute value of difference larger than diflimit, it still has two condition
                        if (Math.abs(dif) > diflimit) {
                            if(pointNum == 0) {//1st condition: start the process with an empty table
                                for(let i = 0; i < response.data.features.length; i++) {
                                    // acquire data from OGC, make sure the data format is correct
                                    let stringx = [response.data.features[i].properties.Country_Region].toString();
                                    if (stringx.includes('(')) {
                                        countryN = stringx.substr(0, stringx.indexOf(' '));
                                    } else if (stringx.includes(',')) {
                                        countryN = stringx.substr(0, stringx.indexOf(','));
                                    } else if (stringx.includes('*')) {
                                        countryN = stringx.substr(0, stringx.indexOf('*'));
                                    } else {
                                        countryN = stringx;
                                    }
                                    // console.log(countryN);
                                    // get the continent columns
                                    let continent = "SELECT Continent_name FROM dtrends.continent WHERE Country LIKE ?;"
                                    con.query(continent, "%" + countryN + "%", function (err, continents) {
                                        // console.log(continents);
                                        let Country_Region_Province_State, Province_State, Country_Region_Province_State_Combine,CountryRegion;
                                        if (response.data.features[i].properties.Province_State == null) {
                                            Province_State = null;
                                            if(response.data.features[i].properties.Country_Region == null){}else{
                                            Country_Region_Province_State = response.data.features[i].properties.Country_Region.replace(/ /g, "_");
                                            CountryRegion = response.data.features[i].properties.Country_Region.replace(/ /g, "_");
                                            }

                                        } else {
                                            Country_Region_Province_State_Combine = response.data.features[i].properties.Country_Region + "_" + response.data.features[i].properties.Province_State;
                                            Country_Region_Province_State = Country_Region_Province_State_Combine.replace(/ /g, "_")
                                            Province_State = response.data.features[i].properties.Province_State.replace(/ /g, "_");
                                        }
                                        // if (response.data.features[i].properties.Province_State == null) {
                                        //     let Province_State = null;
                                        // } else {
                                        //     let Province_State = response.data.features[i].properties.Province_State.replace(/ /g, "_");
                                        // }

                                        let deleting = "DELETE FROM dtrends.covid_19 WHERE Date = ?;"
                                        let d = new Date(parseInt(response.data.features[i].properties.Last_Update));
                                        let date = d.getFullYear() + '-' + ("0" + (d.getMonth() + 1)).slice(-2) + '-' + ("0" + d.getDate()).slice(-2);
                                        let layername = 'coronav_' + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2) + d.getFullYear() + '_' + Country_Region_Province_State;
                                        let sql = "INSERT INTO dtrends.covid_19(Date, LayerName, LayerType, FirstLayer, SecondLayer, DisplayName, CaseNum, DeathNum, RecovNum," +
                                            " ActiveNum, Latitude, Longitude,CityName, StateName, CountryName, ContinentName, Color_Confirmed, Color_Death, Color_Recovered) " +
                                            "VALUES (?,?,'H_PKLayer','Corona_Virus','',?,?,?,?,?,?,?,'',?,?,?,'rgb(220,0,0) rgb(220,0,0) rgb(220,0,0)','rgb(0,0,0) rgb(0,0,0) rgb(0,0,0)','rgb(124,252,0) rgb(124,252,0) rgb(124,252,0)'); ";


                                        // whole insert process
                                        con.query(sql, [date, layername, Country_Region_Province_State, response.data.features[i].properties.Confirmed,
                                            response.data.features[i].properties.Deaths, response.data.features[i].properties.Recovered,
                                            response.data.features[i].properties.Active, response.data.features[i].properties.Lat,
                                            response.data.features[i].properties.Long_, Province_State,
                                            CountryRegion, continents[0].Continent_name.replace(/ /g, "_")], function (err, result) {


                                            if (err) {
                                                console.log(err);
                                            }else {
                                                console.log(i + "record inserted");
                                                // delete the wrong coordinates rows, and send specific values notification
                                                if (i == response.data.features.length-1){
                                                    let deleting_coordinate_email = "SELECT * FROM dtrends.covid_19 WHERE Latitude iS NULL OR Latitude = ?;"
                                                    let deleting_coordinate = "DELETE FROM dtrends.covid_19 WHERE Latitude iS NULL OR Latitude = ?;"

                                                    con.query(deleting_coordinate_email, 0 , function (err,result) {
                                                        let rowsdeleted = JSON.stringify(result);
                                                        fs.writeFile ("datadeleted.json", rowsdeleted, function(err) {
                                                                if (err) throw err;
                                                                console.log('complete');
                                                            }
                                                        );
                                                        const deletedata = {
                                                            from: 'aaaa.zhao@g.northernacademy.org',
                                                            to: 'yumingxian7012@gmail.com;',
                                                            subject: 'Data deleted.',
                                                            attachments:[{
                                                                fileName: 'datadeleted.json',
                                                                path: 'datadeleted.json'
                                                            }]
                                                        };
                                                        transport.sendMail(deletedata, (error, info) => {
                                                            if (error) {
                                                                console.log(error);
                                                            } else {
                                                                console.log(`Message sent: ${info.response}`);
                                                            }
                                                        });
                                                        if (!!result) {
                                                            con.query(deleting_coordinate, 0 , function (err,result) {
                                                                if (err) {
                                                                    console.log(err);
                                                                }
                                                                console.log("Deleted.");
                                                            });
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                        // delete unavailable date data from table
                                        con.query(deleting, "NaN-aN-aN", function (err, result) {

                                            if (err) {
                                                console.log(err);
                                            }
                                        });

                                        if(err){//send notification if the continents acquirement has problems
                                            console.log(err);
                                            transport.sendMail(continent, (error, info) => {
                                                if (error) {
                                                    console.log(error);
                                                } else {
                                                    console.log(`Message sent: ${info.response}`);
                                                }
                                            });

                                        }
                                    });
                                }

                            }
                            else{//2nd possible condition: big jump in OGC data source, then the process will send notification
                                console.log("Differences" + ":" + dif);
                                transport.sendMail(Datalength, (error, info) => {
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        console.log(`Message sent: ${info.response}`);
                                    }
                                });
                            }
                        }else{//else: the absolute value of difference smaller than diflimit, run insert statement
                            for(let i = 0; i < response.data.features.length; i++) {
                                // acquire data from OGC, make sure the data format is correct
                                let stringx = [response.data.features[i].properties.Country_Region].toString();
                                if (stringx.includes('(')) {
                                    countryN = stringx.substr(0, stringx.indexOf(' '));
                                } else if (stringx.includes(',')) {
                                    countryN = stringx.substr(0, stringx.indexOf(','));
                                } else if (stringx.includes('*')) {
                                    countryN = stringx.substr(0, stringx.indexOf('*'));
                                } else {
                                    countryN = stringx;
                                }

                                // get the continent columns
                                let continent = "SELECT Continent_name FROM dtrends.continent WHERE Country LIKE ?;"
                                con.query(continent, "%" + countryN + "%", function (err, continents) {
                                    let Country_Region_Province_State, Province_State, Country_Region_Province_State_Combine;
                                    if (response.data.features[i].properties.Province_State == null) {
                                        Province_State = null;
                                        Country_Region_Province_State = response.data.features[i].properties.Country_Region.replace(/ /g, "_")
                                    } else {
                                        Country_Region_Province_State_Combine = response.data.features[i].properties.Country_Region + "_" + response.data.features[i].properties.Province_State;
                                        Country_Region_Province_State = Country_Region_Province_State_Combine.replace(/ /g, "_")
                                        Province_State = response.data.features[i].properties.Province_State.replace(/ /g, "_");
                                    }
                                    // if (response.data.features[i].properties.Province_State == null) {
                                    //     let Province_State = null;
                                    // } else {
                                    //     let Province_State = response.data.features[i].properties.Province_State.replace(/ /g, "_");
                                    // }

                                    let deleting = "DELETE FROM dtrends.covid_19 WHERE Date = ?;"
                                    let d = new Date(parseInt(response.data.features[i].properties.Last_Update));
                                    let date = d.getFullYear() + '-' + ("0" + (d.getMonth() + 1)).slice(-2) + '-' + ("0" + d.getDate()).slice(-2);
                                    let layername = 'coronav_' + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2) + d.getFullYear() + '_' + Country_Region_Province_State;
                                    let sql = "INSERT INTO dtrends.covid_19(Date, LayerName, LayerType, FirstLayer, SecondLayer, DisplayName, CaseNum, DeathNum, RecovNum," +
                                        " ActiveNum, Latitude, Longitude,CityName, StateName, CountryName, ContinentName, Color_Confirmed, Color_Death, Color_Recovered) " +
                                        "VALUES (?,?,'H_PKLayer','Corona_Virus','',?,?,?,?,?,?,?,'',?,?,?,'rgb(220,0,0) rgb(220,0,0) rgb(220,0,0)','rgb(0,0,0) rgb(0,0,0) rgb(0,0,0)','rgb(124,252,0) rgb(124,252,0) rgb(124,252,0)'); ";


                                    // whole insert process
                                    con.query(sql, [date, layername, response.data.features[i].properties.Country_Region.replace(/ /g, "_"), response.data.features[i].properties.Confirmed,
                                        response.data.features[i].properties.Deaths, response.data.features[i].properties.Recovered,
                                        response.data.features[i].properties.Active, response.data.features[i].properties.Lat,
                                        response.data.features[i].properties.Long_, Province_State,
                                        response.data.features[i].properties.Country_Region.replace(/ /g, "_"), continents[0].Continent_name.replace(/ /g, "_")], function (err, result) {

                                        if (err) {
                                            console.log(err);
                                        }else {
                                            console.log(i + "record inserted");
                                            // delete the wrong coordinates rows, and send specific values notification
                                            if (i == response.data.features.length-1){
                                                let deleting_coordinate_email = "SELECT * FROM dtrends.covid_19 WHERE Latitude iS NULL OR Latitude = ?;"
                                                let deleting_coordinate = "DELETE FROM dtrends.covid_19 WHERE Latitude iS NULL OR Latitude = ?;"

                                                con.query(deleting_coordinate_email, 0 , function (err,result) {
                                                    let rowsdeleted = JSON.stringify(result);
                                                    fs.writeFile ("datadeleted.json", rowsdeleted, function(err) {
                                                            if (err) throw err;
                                                            console.log('complete');
                                                        }
                                                    );
                                                    const deletedata = {
                                                        from: 'aaaa.zhao@g.northernacademy.org',
                                                        to: 'yumingxian7012@gmail.com;',
                                                        subject: 'Data deleted.',
                                                        attachments:[{
                                                            fileName: 'datadeleted.json',
                                                            path: 'datadeleted.json'
                                                        }]
                                                    };
                                                    transport.sendMail(deletedata, (error, info) => {
                                                        if (error) {
                                                            console.log(error);
                                                        } else {
                                                            console.log(`Message sent: ${info.response}`);
                                                        }
                                                    });



                                                    if (!!result) {
                                                        con.query(deleting_coordinate, 0 , function (err,result) {
                                                            if (err) {
                                                                console.log(err);
                                                            }
                                                            console.log("Deleted.");
                                                        });
                                                    }
                                                });
                                            }
                                        }
                                    });
                                    //delete unavailable date data from table
                                    con.query(deleting, "NaN-aN-aN", function (err, result) {

                                        if (err) {
                                            console.log(err);
                                        }
                                    });

                                    if(err){//send notification if the continents acquirement has problems
                                        console.log(err);
                                        transport.sendMail(continent, (error, info) => {
                                            if (error) {
                                                console.log(error);
                                            } else {
                                                console.log(`Message sent: ${info.response}`);
                                            }
                                        });

                                    }
                                });
                            }
                        }


                    });

                })
                .catch(error => {
                    console.log("download incomplete");
                    Timeout();
                });
        }
    })

}


function Timeout() {
    setTimeout(function () {
        if (x < retryNum) {
            x += 1;
            axiosReq();
        } else {
            transport.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log(`Message sent: ${info.response}`);
                }
            });
        }
    }, waitTime);
}

