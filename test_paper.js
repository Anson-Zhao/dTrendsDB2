const axios = require('axios');
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const fs = require('fs');
const cron = require('node-cron');

const con = mysql.createConnection({
    // host: '10.11.90.16',localhost
    host: '10.11.90.16',
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

const errMsg_Download = {
    from: 'aaaa.zhao@g.northernacademy.org',
    to: 'yumingxian7012@gmail.com; azhao@northernacademy.org',
    subject: 'Error Appearance From Covid Data Algorithm',
    html: 'Data can not insert.',
};

const errMsg_DataLength = {
    from: 'aaaa.zhao@g.northernacademy.org',
    to: 'yumingxian7012@gmail.com; azhao@northernacademy.org',
    subject: 'Data Length incorrect',
    html: 'Data did not insert.',
};

const errMsg_sqlConnection = {
    from: 'aaaa.zhao@g.northernacademy.org',
    to: 'yumingxian7012@gmail.com,azhao@northernacademy.org;',
    subject: 'SQL Disconnected',
    html: 'SQL Disconnected.',
};

const errMsg_UndefinedCont = {
    from: 'aaaa.zhao@g.northernacademy.org',
    to: 'yumingxian7012@gmail.com,azhao@northernacademy.org;',
    subject: 'Undefined Continent Appears',
    html: 'Undefined Continent Appears',
};

const dataErr = {
    from: 'aaaa.zhao@g.northernacademy.org',
    to: 'yumingxian7012@gmail.com;azhao@northernacademy.org;',
    subject: 'Data deleted.',
    attachments: [{
        fileName: 'datadeleted.json',
        path: 'datadeleted.json'
    }]
};

let waitTime = 120000;
var start = new Date("11/01/2020");
var end = new Date("12/31/2020");
let difLimit = 80;
// let intervalTime = 24 * 60 * 60 * 1000;
let retryNum = 10;

var loop = new Date(start);
con.connect(function (err) {
Timeout()
function Timeout() {
    // setTimeout(function () {
        if (loop <= end) {
            let data =  ("0" + (loop.getMonth() + 1)).slice(-2)+ "-"+("0" + loop.getDate()).slice(-2) + "-"+ loop.getFullYear();
            let data_s = data.toString();
            let link ='https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/'+data_s+'.csv'
            console.log(loop);
            console.log(link);
            axiosReq(link)
            var newDate = loop.setDate(loop.getDate() + 1);
            loop = new Date(newDate);
        } else {
           console.log("finished")
        }
    setTimeout(function () {
        Timeout();
        }, waitTime);
}

function axiosReq(link) {
    //check connection for mysql, if err,send notification

        if (err) {
            // transport.sendMail(errMsg_sqlConnection, (error, info) => {
            //     if (error) {
            //         console.log(error);
            //     } else {
            //         console.log(`Message sent: ${info.response}`);
            //     }
            // });
            console.log(err)
        } else {
            console.log("MySql Connected");
            //download data from OGC
            axios.get(link)
                .then((response) => {
                    let d = new Date();
                    let y = new Date(d);
                    y.setDate(y.getDate() - 1)

                    //get yesterday's date
                    let yesterday = y.getFullYear() + '-' + ("0" + (y.getMonth() + 1)).slice(-2) + '-' + ("0" + y.getDate()).slice(-2);
                    let countcheck = "SELECT COUNT(LayerName) AS rowscount FROM dtrends.covid_19_JH WHERE Date = ?;"
                    con.query(countcheck, [yesterday], async function (err, count) {//check data length
                        let pointNum = parseFloat(count[0].rowscount);
                        let dif = response.length - pointNum;

                        //if the absolute value of difference larger than difLimit, it still has two condition
                        if (Math.abs(dif) > difLimit) {
                            if (pointNum == 0) {
                                //1st condition: start the process with an empty table
                                let x = dataProcessing(response);
                                if(x == 1){
                                    // con.end();
                                }
                            } else {
                                //2nd possible condition: big jump in OGC data source, then the process will send notification
                                console.log("Differences" + ":" + dif);
                                // transport.sendMail(errMsg_DataLength, (error, info) => {
                                //     if (error) {
                                //         console.log(error);
                                //     } else {
                                //         console.log(`Message sent: ${info.response}`);
                                //     }
                                // });
                            }
                        } else {
                            //else: the absolute value of difference smaller than difLimit, run insert statement
                            let x = dataProcessing(response);
                            if(x == 1){
                                // con.end();
                            }


                        }
                    });
                })
                .catch(error => {
                    console.log(error);
                });
        }


}
function dataProcessing(download) {
    let num = 1;
    let csvdata = download.data;
    var Arr = csvdata.split("\n");
    // Arr.length
    for (let i = 1; i < Arr.length; i++) {

        let Country_Name,Province_State, County, Layer_Name,DisplayName;
        var nameArr = Arr[i].split(',');


        //Country Region
        if (nameArr[3] === "US") {
            Country_Name = "United_States";
        } else {
            if(nameArr[3].includes('*')||nameArr[3].includes('(') || nameArr[3].includes('.') || nameArr[3].includes("'") || nameArr[3].includes('-')||nameArr[3].includes('"')){
                Country_Name = nameArr[3].replace(/[^a-zA-Z0-9 ]/g, "");
                Country_Name = Country_Name.replace(/ /g, "_");
            }else {
                Country_Name = nameArr[3].replace(/ /g, "_");
            }
        }

        if(nameArr[3].includes('*')||nameArr[3].includes('(') || nameArr[3].includes('.') || nameArr[3].includes("'") || nameArr[3].includes('-')||nameArr[3].includes('"')){
            let CountryN = nameArr[3].replace(/[^a-zA-Z0-9 ]/g, "");
            CountryN = Country_Name.replace(/ /g, " ");
        }else {
            CountryN = nameArr[3];
        }
        if(CountryN === "United Kingdom"){
            CountryName = "United Kingdom"
        }else{
            CountryName = CountryN.split(" ")[0];
        }



        // console.log(i,Country_Name,CountryN);


        //Date
        let Last_Update = String(nameArr[4]);
        // Last_Update = ("0" + (date.getMonth() + 1)).slice(-2) +("0" + (date.getDate()+1)).slice(-2) +  date.getFullYear();
        let date = new Date(Last_Update);
        Last_Update =   date.getFullYear() + "-"+("0" + (date.getMonth() + 1)).slice(-2) +"-"+("0" + (date.getDate())).slice(-2);
        let layernameDate = ("0" + (date.getMonth() + 1)).slice(-2) +("0" + (date.getDate())).slice(-2) +  date.getFullYear();
        //
        //
        // //Province States
        if (nameArr[2] === ' ') {
            Province_State = '';
        } else if (nameArr[2].includes('(') || nameArr[2].includes('.') || nameArr[2].includes("'") || nameArr[2].includes('-')|| nameArr[2].includes('"')||nameArr[2].includes(",")||nameArr[2].includes('*') ) {
            Province_State = nameArr[2].replace(/[^a-zA-Z0-9 ]/g, "");
            Province_State = Province_State.replace(/ /g, "_");
        } else {
            Province_State = nameArr[2].replace(/ /g, "_");
        }
        //
        //
        // //County
        if (nameArr[1] === ' ') {
            County = '';
        } else if (nameArr[1].includes('(') || nameArr[1].includes('.') || nameArr[1].includes("'") || nameArr[1].includes('-')||nameArr[1].includes(',')||nameArr[1].includes('*')  ) {
            County = nameArr[1].replace(/[^a-zA-Z0-9 ]/g, "");
            County = County.replace(/ /g, "_");
        } else {
            County = nameArr[1].replace(/ /g, "_");
        }
        // // console.log(County);
        //
        // //Layer name(combination with the layer type, date, country, province state, county)
        if (County === '') {
            if (Province_State === '') {
                Layer_Name = 'coronav_' + layernameDate + '_' + Country_Name;
            } else {
                Layer_Name = 'coronav_' + layernameDate + '_' + Country_Name + "_" + Province_State;
            }
        } else {
            Layer_Name = 'coronav_' + layernameDate + '_' + Country_Name + "_" + Province_State + "_" + County;
        }

        //Display Name
        if (County === '') {
            if (Province_State === '') {
                DisplayName =  Country_Name;
            } else {
                DisplayName =   Country_Name + "_" + Province_State;
            }
        } else {
            DisplayName =  Country_Name + "_" + Province_State + "_" + County;
        }
        // //Coordinates
        let Lat = nameArr[5];
        let Long = nameArr[6];
        // console.log(i,Lat,Long, Layer_Name);
        //
        // //Case Num
        let Confirmed = nameArr[7];
        let Death = nameArr[8];
        let Recovered = nameArr[9];
        let Active = nameArr[10];

        let continent = "SELECT Continent_name FROM dtrends.continent WHERE Country LIKE ? GROUP BY Continent_name;"
        // console.log(Country_Name);
        con.query(continent, ["%" + CountryName + "%"], function (err, resu) {

                let ContinentName = resu[0].Continent_name;
                ContinentName = ContinentName.replace(/(\r\n|\n|\r)/gm,"");
                ContinentName = ContinentName.replace(/ /g, "_");


            // console.log(ContinentName);

            let sql = "INSERT INTO dtrends.covid_19_JH(Date, LayerName, LayerType, FirstLayer, DisplayName, CaseNum, DeathNum, RecovNum," +
                " ActiveNum, Latitude, Longitude,CityName, StateName, CountryName, ContinentName, Color_Confirmed, Color_Death, Color_Recovered) " +
                "VALUES (?,?,'H_PKLayer','Corona_Virus',?,?,?,?,?,?,?,?,?,?,?,'rgb(220,0,0) rgb(220,0,0) rgb(220,0,0)','rgb(0,0,0) rgb(0,0,0) rgb(0,0,0)','rgb(124,252,0) rgb(124,252,0) rgb(124,252,0)'); ";
            let Third_data = "INSERT INTO dtrends.covid_19_Final(Date, LayerName, LayerType, FirstLayer, DisplayName, CaseNum, DeathNum, RecovNum," +
                " ActiveNum, Latitude, Longitude,CityName, StateName, CountryName, ContinentName, Color_Confirmed, Color_Death, Color_Recovered) " +
                "VALUES (?,?,'H_PKLayer','Corona_Virus',?,?,?,?,?,?,?,?,?,?,?,'rgb(220,0,0) rgb(220,0,0) rgb(220,0,0)','rgb(0,0,0) rgb(0,0,0) rgb(0,0,0)','rgb(124,252,0) rgb(124,252,0) rgb(124,252,0)'); ";

            con.query(sql, [Last_Update, Layer_Name,DisplayName,Confirmed,Death,Recovered,Active,Lat,Long, County, Province_State,Country_Name,ContinentName],function (err, result) {
                console.log("inserted",i);
                if (err) {
                    console.log(err);
                } else {
                    if (i === Arr.length -2) {
                    // Arr.length -2
                        let deleting_coordinate_email = "SELECT * FROM dtrends.covid_19_JH WHERE Latitude iS NULL OR Latitude = ?;"
                        let deleting_coordinate = "DELETE FROM dtrends.covid_19_JH WHERE Latitude iS NULL OR Latitude = ?;"
                        let deleting_Date = "DELETE FROM dtrends.covid_19_JH WHERE Date = ?;"

                        con.query(deleting_coordinate_email, 0, function (err, result) {
                            let rowsdeleted = JSON.stringify(result);
                            fs.writeFile("datadeleted.json", rowsdeleted, function (err) {
                                    if (err) throw err;
                                    console.log('complete');
                                }
                            );

                            // transport.sendMail(dataErr, (error, info) => {
                            //     if (error) {
                            //         console.log(error);
                            //     } else {
                            //         console.log(`Message sent: ${info.response}`);
                            //     }
                            // });

                            if (!!result) {
                                con.query(deleting_coordinate, 0, function (err, result) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    console.log("Deleted.");
                                });
                                con.query(deleting_Date, 'NaN-aN-aN', function (err, result) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    console.log("Deleted.");
                                });
                                // return num;




                            }
                        });
                    }
                }
            });
            con.query(Third_data,[Last_Update, Layer_Name,DisplayName,Confirmed,Death,Recovered,Active,Lat,Long, County, Province_State,Country_Name,ContinentName], function (err, result) {
                if (err) {
                    console.log(err);
                }else{
                    // Arr.length -2

                    if (i === Arr.length -2) {
                        let deleting_coordinate_email_Final = "SELECT * FROM dtrends.covid_19_Final WHERE Latitude iS NULL OR Latitude = ?;"
                        let deleting_coordinate_Final = "DELETE FROM dtrends.covid_19_Final WHERE Latitude iS NULL OR Latitude = ?;"
                        let deleting_Date_Final = "DELETE FROM dtrends.covid_19_Final WHERE Date = ?;"

                        con.query(deleting_coordinate_email_Final, 0, function (err, result) {
                            let rowsdeleted = JSON.stringify(result);
                            fs.writeFile("datadeleted.json", rowsdeleted, function (err) {
                                    if (err) throw err;
                                    console.log('complete');
                                }
                            );

                            // transport.sendMail(dataErr, (error, info) => {
                            //     if (error) {
                            //         console.log(error);
                            //     } else {
                            //         console.log(`Message sent: ${info.response}`);
                            //     }
                            // });

                            if (!!result) {
                                con.query(deleting_coordinate_Final, 0, function (err, result) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    console.log("Deleted.");

                                });
                                con.query(deleting_Date_Final, 'NaN-aN-aN', function (err, result) {
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
            if (err) {
                //send notification if the continents acquirement has problems
                console.log(err);
                // transport.sendMail(errMsg_UndefinedCont, (error, info) => {
                //     if (error) {
                //         console.log(error);
                //     } else {
                //         console.log(`Message sent: ${info.response}`);
                //     }
                // });
            }


        });



    }
}
})