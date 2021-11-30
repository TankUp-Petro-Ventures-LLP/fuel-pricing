import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Config } from '../configuration/config';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json'})
};

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  async getDealerCodes() {
    return this.http
                .get(`http://${Config.API_URL}/api/vendor/dealer-codes`, httpOptions)
                .toPromise()
                .then(res => {
                  // console.log('RESULT :: ', res)
                  return res
                })
                .catch(err => {
                  console.log('ERROR :: ', err)
                  return err
                })
  }

  updateVendorPricing(obj) {
    return this.http
                .post(`http://${Config.API_URL}/api/vendor/daily-vendor-pricing`, obj, httpOptions)
                .toPromise()
                .then(res => {
                  // console.log('RESULT ::: ', res)
                  return res
                })
                .catch(Error => {
                  console.log('ERROR :: ', Error)
                  return Error
                })
  }

  updateCityPricing(obj) {
    return this.http
                .post(`http://${Config.API_URL}/api/vendor/daily-city-pricing`, obj, httpOptions)
                .toPromise()
                .then(res => {
                  // console.log('RESULT ::: ', res)
                  return res
                })
                .catch(Error => {
                  console.log('ERROR :: ', Error)
                  return Error
                })
  }


}
