import { ChangeDetectorRef, Component } from '@angular/core';
import { BackgroundMode } from '@ionic-native/background-mode/ngx';
import { SMS } from '@ionic-native/sms/ngx';
import { AlertController } from '@ionic/angular';
import { ApiService } from '../api.service';

declare var SMSReceive: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage {

  dealerCodes: any;
  hpclDealer: string[] = [];
  bpclDealer: string[] = [];
  ioclDealer: string[] = [];

  countOfSentMessages: number = 0;
  countOfReceivedMessages: number = 0;
  countOfVendorsUpdated: number = 0;
  isSendButtonClicked: boolean = false;
  isReceiveButtonClicked: boolean = false;

  vendorCount: number = 0;

  constructor(private alertCtrl: AlertController, private sms: SMS, public apiService: ApiService, private backgroundMode: BackgroundMode, private ref: ChangeDetectorRef) {
    this.backgroundMode.enable();
    this.getAllVendors()
  }

  async getAllVendors() {
    await this.apiService.getDealerCodes().then(res => {
      this.dealerCodes = res;
      console.log('DEALERCODES:: ', this.dealerCodes)
      this.vendorCount = this.dealerCodes.length
      this.assignVendors();
    })
  }

  assignVendors() {
    for(let i = 0; i < this.dealerCodes.length; i++) {
      
      if (this.dealerCodes[i].oil_company_id === 2) {
        this.hpclDealer.push(this.dealerCodes[i].dealer_code)}

      else if (this.dealerCodes[i].oil_company_id === 3)
        this.ioclDealer.push(this.dealerCodes[i].dealer_code)

      else if(this.dealerCodes[i].oil_company_id === 4)
        this.bpclDealer.push(this.dealerCodes[i].dealer_code)
    }
  }

  async presentAlert(message) {
    const alert = await this.alertCtrl.create({
      header: 'Messages Sent!',
      subHeader: 'Requesting Diesel Prices of all Vendors',
      buttons: ['OK']
    });
    await alert.present();
  }

  start() {
    this.isReceiveButtonClicked = true;
    SMSReceive.startWatch(
      () => {
        console.log('WATCH STARTED');
        document.addEventListener('onSMSArrive', (e: any) => {
          var IncomingSMS = e.data;
          if (IncomingSMS.body && IncomingSMS.body.indexOf('Diesel') != -1) {
            ++this.countOfReceivedMessages;
            this.ref.detectChanges();
            this.processSMS(IncomingSMS);
          }
          else if (IncomingSMS.body.indexOf('HELLO TANKUP') != -1)
            this.sendSms(1);
        });
      },
      () => { console.log('WATCH START Failed') }
    )
  }

  sendSms(flag) {
    this.isSendButtonClicked = true;
    this.presentAlert('Sending the messages');
    if(flag !== 1)
      this.start();
    var options = {
      replaceLineBreaks: false,
      android: {
          intent: ''
      }
    };
    var number = '+919222201122'
    for (let i = 0; i < this.hpclDealer.length; i++) {
      var message = 'HPPRICE ' + this.hpclDealer[i];
      this.sms.send(number, message, options);
      ++this.countOfSentMessages;
      console.log('Message: ' + message);
    }
    number = '+919223112222';
    for (let i = 0; i < this.bpclDealer.length; i++) {
      var message = 'RSP ' + this.bpclDealer[i];
      this.sms.send(number, message, options);
      ++this.countOfSentMessages;
      console.log('Message: ' + message);
    }
    number = '+919224992249';
    for (let i = 0; i < this.ioclDealer.length; i++) {
      var message = 'RSP ' + this.ioclDealer[i];
      this.sms.send(number, message, options);
      ++this.countOfSentMessages;
      console.log('Message: ' + message);
    }
    this.ref.detectChanges();
  }

  processSMS(IncomingSMS) {
    if (IncomingSMS.address.indexOf('HPCL') != -1)
      this.processSMSHpcl(IncomingSMS.body);
    else if (IncomingSMS.address.indexOf('BPCL') != -1)
      this.processSMSBpcl(IncomingSMS.body);
    else if(IncomingSMS.address.indexOf('IOC') != -1)
      this.processSMSIocl(IncomingSMS.body);

    ++this.countOfVendorsUpdated;
    this.ref.detectChanges();
  }

  processSMSHpcl(message) {
    let dealerCode = message.substring(message.indexOf('(') + 1, message.indexOf(')'));
    let price = message.substring(message.indexOf('Diesel') + 7, message.indexOf('Power') - 1);
    let priceObj = {
      'dealerCode' : dealerCode,
      'price': price
    }
    this.apiService.updateVendorPricing(priceObj);
    console.log('DEALER CODE: ', dealerCode);
    console.log('PRICE: ', price);
  }

  processSMSBpcl(message) {
    let dealerCode = message.substring(message.indexOf('(') + 1, message.indexOf(')'));
    let price = message.substring(message.indexOf('Diesel') + 7, message.indexOf('Diesel') + 12);
    if(price.slice(-1) === ',')
      price = price.slice(0, -1);
    let priceObj = {
      'dealerCode' : dealerCode,
      'price': price
    }
    this.apiService.updateVendorPricing(priceObj);
    console.log('DEALER CODE: ', dealerCode);
    console.log('PRICE: ', price);
  }

  processSMSIocl(message) {
    let indexOfFirstDigit = message.search(/\d/);
    let dealerCode = message.substring(indexOfFirstDigit, indexOfFirstDigit + 6);
    let price = message.substring(message.indexOf('Rs ') + 3, message.indexOf('Rs ') + 8);
    if(price.slice(-1) === ',')
      price = price.slice(0, -1);
    let priceObj = {
      'dealerCode' : dealerCode,
      'price': price
    }
    this.apiService.updateVendorPricing(priceObj);
    console.log('DEALER CODE: ', dealerCode);
    console.log('PRICE: ', price);
  }

  stop() {
    this.isSendButtonClicked = false;
    this.isReceiveButtonClicked = false;
    this.countOfSentMessages = 0;
    this.countOfReceivedMessages = 0;
    this.countOfVendorsUpdated = 0;
    SMSReceive.stopWatch(
      () => { console.log('WATCH STOPPED') },
      () => { console.log('WATCH STOP Failed') }
    )
  }
}
