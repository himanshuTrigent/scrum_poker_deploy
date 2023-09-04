import { Component, OnDestroy, OnInit } from '@angular/core';
import { cardCount } from '../shared/app-data/scrum-points-series';
import { HeartbeatService } from '../shared/services/heartbeat.service';
import { WebsocketService } from '../shared/services/websocket.service';
import { ActivatedRoute } from '@angular/router';
import { UserAction, UserData } from '../shared/model/userAction';
import { RoomService } from '../shared/services/room.service';
import { Router } from '@angular/router';
import { UserFormComponent } from '../user-form/user-form.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CookieService } from 'ngx-cookie-service';
import { User, defaultsUser } from '../shared/model/user';
import { StorageService } from '../shared/services/storage.service';
import { v4 as uuidv4 } from 'uuid';
import { ToastService, toastState } from '../shared/services/toast.service';
import { Subscription } from 'rxjs';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { emojiData } from '../shared/app-data/emoji-data';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css'],
  providers: [WebsocketService],
})
export class RoomComponent implements OnInit, OnDestroy {
  public cardCounts: number[] = cardCount;
  public activeIndex: number = -1;
  public roomId!: any;
  public userJobRole: string = '';
  public user: UserData = defaultsUser;
  public usersArray: {
    actionType: UserAction['actionType'];
    userData: UserData;
  }[] = [];
  public userAction!: UserAction | any;
  public isStoryPointsRevealed: boolean = false;
  public selectedPoints: number[] = [];
  public storyPointsData: { points: number; repetition: number }[] = [];
  public averageStoryPointsValue: number = 0;
  private messageSubsscription!: Subscription;
  public isRevealBtnDisabled: boolean = true;
  public isDataStored!: boolean;
  public emojiData = emojiData;

  constructor(
    private websocketService: WebsocketService,
    private route: ActivatedRoute,
    private heartBeat: HeartbeatService,
    private roomService: RoomService,
    private router: Router,
    private cookieService: CookieService,
    private userDialog: MatDialog,
    private storageService: StorageService,
    private toast: ToastService
  ) {}

  public ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.roomId = params['roomId'];
    });

    this.openUserDialog();
    this.messageSubsscription = this.websocketService.recievedMessage.subscribe(
      (message: string): void => {
        if (message) {
          const userData: UserAction = JSON.parse(message);

          switch (userData.actionType) {
            case 'ACTIVE_USERS_LIST': {
              (userData.userData as UserData[]).forEach((user: UserData) => {
                if (user.userId == this.user.userId) this.user = user;

                this.usersArray.push({
                  actionType: user.data?.storyPoints
                    ? 'STORY_POINT_SELECTION'
                    : 'STORY_POINT_PENDING',
                  userData: user,
                });
              });
              break;
            }
            case 'NEW_USER_JOINED': {
              this.usersArray.push({
                actionType: 'STORY_POINT_PENDING',
                userData: userData.userData as UserData,
              });
              break;
            }
            case 'USER_LEFT': {
              this.usersArray = this.usersArray.filter(
                (user: UserAction) =>
                  (user.userData as UserData).userId !=
                  (userData.userData as UserData).userId
              );
              break;
            }
            case 'STORY_POINT_SELECTION': {
              this.usersArray.forEach(
                (usersData: UserAction, index: number) => {
                  if (
                    (usersData.userData as UserData).userId ==
                    (userData.userData as UserData).userId
                  ) {
                    this.usersArray[index].userData['data'] = (
                      userData.userData as UserData
                    ).data;

                    this.usersArray[index].actionType = userData.actionType;
                  }
                }
              );
              if (this.isRevealBtnDisabled) this.isRevealBtnDisabled = false;
              break;
            }
            case 'STORY_POINT_REVEAL': {
              this.usersArray.forEach((usersData: UserAction) => {
                if ((usersData.userData as UserData).data?.storyPoints) {
                  usersData.actionType = userData.actionType;
                  this.selectedPoints.push(
                    (usersData.userData as UserData).data?.storyPoints as number
                  );
                }
              });
              this.calculateAverage();
              this.isStoryPointsRevealed = true;
              break;
            }
            case 'STORY_POINT_RESET': {
              this.usersArray.forEach((usersData: UserAction) => {
                if ((usersData.userData as UserData).data?.storyPoints) {
                  usersData.actionType = 'STORY_POINTS_PENDING';
                  (userData.userData as UserData)['data'] = {
                    storyPoints: null,
                  };
                  this.reset();
                }
              });
              break;
            }
            case 'CHANGE_ADMIN': {
              (userData.userData as UserData[]).forEach((userData) => {
                if (this.user.userId == userData.userId) {
                  this.user.isAdmin = true;
                  this.toast.showToast(
                    `Congrats ${this.user.displayName.toUpperCase()}! You are now Admin`,
                    toastState.success
                  );
                }
              });

              this.usersArray.forEach((usersDetails: UserAction) => {
                if (
                  (userData.userData as UserData[])[0].userId ==
                  (usersDetails.userData as UserData).userId
                ) {
                  (usersDetails.userData as UserData).isAdmin = (
                    userData.userData as UserData[]
                  )[0].isAdmin;
                  return;
                } else if (
                  (usersDetails.userData as UserData).userId ==
                  (userData.userData as UserData[])[1].userId
                ) {
                  (usersDetails.userData as UserData).isAdmin = (
                    userData.userData as UserData[]
                  )[1].isAdmin;
                }
              });
              break;
            }
          }
        }
      }
    );
  }

  public ngOnDestroy(): void {
    this.websocketService.disconnect();
    this.messageSubsscription.unsubscribe();
    this.heartBeat.destroyHeartbeat();
  }

  public updateStoryPoints(storyPoints: number, index: number): void {
    this.toggleActive(index);
    this.userAction = {
      actionType: 'STORY_POINT_SELECTION',
      userData: {
        userId: this.user.userId,
        displayName: this.user.displayName,
        data: {
          storyPoints: storyPoints,
        },
      },
    };
    this.roomService.updateStoryPoint(this.roomId, this.userAction).subscribe(
      (response: UserAction) => {
        this.usersArray.forEach((usersData: UserAction, index: number) => {
          if (
            (usersData.userData as UserData).userId ==
            (response.userData as UserData).userId
          ) {
            this.usersArray[index].userData['data'] = (
              response.userData as UserData
            ).data;

            this.usersArray[index].actionType = response.actionType;
          }
          if (this.isRevealBtnDisabled) this.isRevealBtnDisabled = false;
        });
      },
      (error) => {
        this.toast.showToast('something went wrong', error);
      }
    );
  }

  public joinRoom(userDetails: User): void {
    userDetails.jobRole = this.userJobRole;
    this.roomService.joinRoom(this.roomId, userDetails).subscribe(
      (response) => {
        console.log(response);
        this.websocketService.connect(this.roomId);
        this.heartBeat.startwithHeartBeat(this.roomId);
      },
      (error) => {
        this.router.navigate(['Oops']);
        this.toast.showToast(error.error.error, toastState.danger);
      }
    );
  }

  public toggleActive(index: number): void {
    this.activeIndex = this.activeIndex === index ? -1 : index;
    this.heartBeat.resetHeartbeatTime(this.roomId);
  }

  public openUserDialog(): void {
    const userInCookies: string = atob(this.cookieService.get('userDetails'));
    const jobRole = atob(this.cookieService.get('JobRole'));
    this.userJobRole = jobRole;

    if (userInCookies) {
      this.isDataStored = true;
      this.user = JSON.parse(userInCookies);
    }

    if (!jobRole || !userInCookies) {
      const userDialogRef: MatDialogRef<UserFormComponent> =
        this.userDialog.open(UserFormComponent, {
          data: {
            role: 'Job Role',
            img: '🙂',
            disable: false,
            displayName: this.isDataStored
              ? JSON.parse(userInCookies).displayName
              : '',
          },
          width: '300px',
          height:'410px',
        });

      userDialogRef.afterClosed().subscribe((response: any): void => {
        if (response) {
          if (!userInCookies) {
            this.user.userId = uuidv4();
            this.user.displayName = response.displayName;
            this.userJobRole = response.selectedJobRole;
            this.storageService.storeUserInCookies(this.user);
          }
          this.userJobRole = response.selectedJobRole;
          this.storageService.storeJobRole(response.selectedJobRole);
          this.storageService.userDetails = this.user;
          this.joinRoom(this.user);
        }
        else this.router.navigate(['/'])
      });
    } else {
      this.user = JSON.parse(userInCookies);
      this.joinRoom(this.user);
    }
  }

  public changeAdminUser(newAdminUser: UserData): void {
    const confrimationDailog = this.userDialog.open(ConfirmDialogComponent, {
      data: { type: 'displayName', value: newAdminUser.displayName },
    });

    confrimationDailog.afterClosed().subscribe((data: string) => {
      if (data == 'displayName') {
        this.roomService
          .changeAdminUser(
            {
              actionType: 'CHANGE_ADMIN',
              userData: {
                userId: newAdminUser.userId,
                displayName: newAdminUser.displayName,
                isAdmin: true,
              },
            },
            this.roomId
          )
          .subscribe(
            (response: UserAction) => {
              this.user.isAdmin = false;
              this.usersArray.forEach((usersDetails: UserAction) => {
                if (
                  (usersDetails.userData as UserData).userId ==
                  (response.userData as UserData[])[0].userId
                ) {
                  (usersDetails.userData as UserData).isAdmin = (
                    response.userData as UserData[]
                  )[0].isAdmin;
                } else if (
                  (usersDetails.userData as UserData).userId ==
                  (response.userData as UserData[])[1].userId
                ) {
                  (usersDetails.userData as UserData).isAdmin = (
                    response.userData as UserData[]
                  )[1].isAdmin;
                }
              });
            },
            (error) => {
              this.toast.showToast(error.error.error, toastState.danger);
            }
          );
      }
    });
  }

  public revealStoryPoints(): void {
    this.userAction = {
      actionType: 'STORY_POINT_REVEAL',
      userData: {
        userId: this.user.userId,
        displayName: this.user.displayName,
      },
    };
    this.roomService
      .revealStoryPoints(this.roomId, this.userAction)
      .subscribe((response: UserAction) => {
        if (response.actionType == 'STORY_POINT_REVEAL') {
          this.usersArray.forEach((userData: UserAction) => {
            if ((userData.userData as UserData).data?.storyPoints) {
              userData.actionType = response.actionType;
              if ((userData.userData as UserData).data?.storyPoints) {
                this.selectedPoints.push(
                  (userData.userData as UserData).data?.storyPoints as number
                );
              }
            }
          });
          this.isStoryPointsRevealed = true;
          this.calculateAverage();
        }
      });
  }

  public resetStoryPoints(): void {
    this.userAction = {
      actionType: 'STORY_POINT_RESET',
      userData: {
        userId: this.user.userId,
        displayName: this.user.displayName,
      },
    };
    this.roomService
      .resetStoryPoints(this.roomId, this.userAction)
      .subscribe((response: UserAction) => {
        if (response.actionType == 'STORY_POINT_RESET') {
          this.usersArray.forEach((userData: UserAction) => {
            userData.actionType = 'STORY_POINTS_PENDING';
            (userData.userData as UserData)['data'] = {
              storyPoints: null,
            };
          });
          this.reset();
        }
      });
  }

  private calculateAverage(): void {
    this.selectedPoints.sort((a, b) => a - b);
    let storyPointsSum = this.selectedPoints[0];
    let repeat = 1;
    if (this.selectedPoints.length == 1) {
      this.storyPointsData.push({
        points: this.selectedPoints[0],
        repetition: repeat,
      });
    } else {
      for (let i = 1; i < this.selectedPoints.length; i++) {
        if (this.selectedPoints[i] == this.selectedPoints[i - 1]) {
          repeat++;
        } else {
          this.storyPointsData.push({
            points: this.selectedPoints[i - 1],
            repetition: repeat,
          });
          repeat = 1;
        }
        if (i == this.selectedPoints.length - 1) {
          this.storyPointsData.push({
            points: this.selectedPoints[i],
            repetition: repeat,
          });
        }
        storyPointsSum += this.selectedPoints[i];
      }
    }
    this.averageStoryPointsValue = storyPointsSum / this.selectedPoints.length;
  }

  private reset(): void {
    this.selectedPoints.length = 0;
    this.isStoryPointsRevealed = false;
    this.toggleActive(-1);
    this.storyPointsData.length = 0;
    this.isRevealBtnDisabled = true;
  }
}
