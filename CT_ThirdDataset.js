const mysql = require('mysql');

const con = mysql.createConnection({
    // host: '10.11.90.16',localhost
    host: '10.11.90.16',
    user: 'AppUser',
    password: 'Special888%',
    database: 'dtrends'
});

let date = new Date();
// date.getFullYear()+"-"+("0" + (date.getMonth() + 1)).slice(-2) + "-"+("0" + (date.getDate()-1)).slice(-2);
let Date_n =  "2021-01-19"
let First_Data ="SELECT * FROM dtrends.covid_19 WHERE Date = ?;"
let Sec_Data = "SELECT * FROM dtrends.covid_19_test WHERE Date = ?;"

con.query(Sec_Data,Date_n,function (err, Sec_Data) {
   // console.log(Sec_Data);
    con.query(First_Data,Date_n,function (err, First_Data) {
        // console.log(Sec_Data);

        for(let i = 0; i < Sec_Data.length; i++){
            let Only_Data = "SELECT LayerName FROM dtrends.covid_19 WHERE LayerName = ?;"
            con.query(Only_Data, Sec_Data[i].LayerName, function (err, result) {
                if(result == ""){
                   // console.log(Sec_Data[i].LayerName)
                    let Third_data = "INSERT INTO dtrends.covid_19_test2(Date, LayerName, LayerType, FirstLayer, DisplayName, CaseNum, DeathNum, RecovNum," +
                        " ActiveNum, Latitude, Longitude,CityName, StateName, CountryName, ContinentName, Color_Confirmed, Color_Death, Color_Recovered) " +
                        "VALUES (?,?,'H_PKLayer','Corona_Virus',?,?,?,?,?,?,?,?,?,?,?,'rgb(220,0,0) rgb(220,0,0) rgb(220,0,0)','rgb(0,0,0) rgb(0,0,0) rgb(0,0,0)','rgb(124,252,0) rgb(124,252,0) rgb(124,252,0)'); ";
                    con.query(Third_data,[Sec_Data[i].Date, Sec_Data[i].LayerName, Sec_Data[i].DisplayName, Sec_Data[i].CaseNum,
                        Sec_Data[i].DeathNum, Sec_Data[i].RecovNum, Sec_Data[i].ActiveNum, Sec_Data[i].Latitude, Sec_Data[i].Longitude,
                        Sec_Data[i].CityName, Sec_Data[i].StateName,Sec_Data[i].CountryName,Sec_Data[i].ContinentName] , function (err, result) {
                        if (err) {
                            console.log(err);
                        }else{
                            if(i === Sec_Data.length -2){
                                console.log("123456789","JH1")
                            }
                        }
                    });
                }else{
                    let Third_data_a = "INSERT INTO dtrends.covid_19_test2(Date, LayerName, LayerType, FirstLayer, DisplayName, CaseNum, DeathNum, RecovNum," +
                        " ActiveNum, Latitude, Longitude,CityName, StateName, CountryName, ContinentName, Color_Confirmed, Color_Death, Color_Recovered) " +
                        "VALUES (?,?,'H_PKLayer','Corona_Virus',?,?,?,?,?,?,?,?,?,?,?,'rgb(220,0,0) rgb(220,0,0) rgb(220,0,0)','rgb(0,0,0) rgb(0,0,0) rgb(0,0,0)','rgb(124,252,0) rgb(124,252,0) rgb(124,252,0)'); ";
                    con.query(Third_data_a,[Sec_Data[i].Date, Sec_Data[i].LayerName, Sec_Data[i].DisplayName, Sec_Data[i].CaseNum,
                        Sec_Data[i].DeathNum, Sec_Data[i].RecovNum, Sec_Data[i].ActiveNum, Sec_Data[i].Latitude, Sec_Data[i].Longitude,
                        Sec_Data[i].CityName, Sec_Data[i].StateName,Sec_Data[i].CountryName,Sec_Data[i].ContinentName] , function (err, result) {
                        if (err) {
                            console.log(err);
                        }else{
                            if(i === Sec_Data.length -2){
                                console.log("123456789")
                            }
                        }
                    });
                    // console.log("JH",i)
                }


            });


        }
            for(let k = 0; k < First_Data.length; k++){
                let Only_Data_a = "SELECT LayerName FROM dtrends.covid_19_test WHERE LayerName = ?;"
                con.query(Only_Data_a, First_Data[k].LayerName, function (err, result) {
                    if(result == ""){
                        let Third_data_OGC = "INSERT INTO dtrends.covid_19_test2(Date, LayerName, LayerType, FirstLayer, DisplayName, CaseNum, DeathNum, RecovNum," +
                            " ActiveNum, Latitude, Longitude,CityName, StateName, CountryName, ContinentName, Color_Confirmed, Color_Death, Color_Recovered) " +
                            "VALUES (?,?,'H_PKLayer','Corona_Virus',?,?,?,?,?,?,?,?,?,?,?,'rgb(220,0,0) rgb(220,0,0) rgb(220,0,0)','rgb(0,0,0) rgb(0,0,0) rgb(0,0,0)','rgb(124,252,0) rgb(124,252,0) rgb(124,252,0)'); ";
                        con.query(Third_data_OGC,[First_Data[k].Date, First_Data[k].LayerName, First_Data[k].DisplayName, First_Data[k].CaseNum,
                            First_Data[k].DeathNum, First_Data[k].RecovNum, First_Data[k].ActiveNum, First_Data[k].Latitude, First_Data[k].Longitude,
                            First_Data[k].CityName, First_Data[k].StateName,First_Data[k].CountryName,First_Data[k].ContineNtname] , function (err, result) {
                            if (err) {
                                console.log(err);
                            }else{
                                // if(k === First_Data.length -2){
                                //     console.log("123456")
                                // }
                            }
                        });
                    }else{

                    }

                });
            }

    });

});
