import { Injectable } from '@angular/core';
import { User } from '../model/user';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  public user!: User;

  constructor(private cookieService: CookieService) {}

  public storeUserInCookies(userDetails: User): void {
    const encodedUser: string = btoa(JSON.stringify(userDetails));
    this.cookieService.set('userDetails', encodedUser, {
      expires: 365,
      path: '/',
    });
  }

  public storeJobRole(userJobRole: string): void {
    var expireTime = new Date();
    expireTime.setTime(expireTime.getTime() + 1 * 3600 * 1000);
    const encodeJobRole: string = btoa(userJobRole);
    this.cookieService.set('JobRole', encodeJobRole, {
      expires: expireTime,
      path: '/',
    });
  }

  public get userDetails(): User {
    return this.user;
  }
  public set userDetails(userDetails: User) {
    this.user = userDetails;
  }
}
