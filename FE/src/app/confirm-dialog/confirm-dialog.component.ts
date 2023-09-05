import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HeartbeatService } from '../shared/services/heartbeat.service';
import { WebsocketService } from '../shared/services/websocket.service';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css'],
})
export class ConfirmDialogComponent implements OnInit {
  constructor(
    private router: Router,
    public heartbeatService: HeartbeatService,
    public websocketService: WebsocketService,
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      type: string;
      value: string;
    }
  ) {}

  public timeLeft: number = 60;
  public interval: any;
  
  ngOnInit(): void {
    this.startTimer();
  }
  startTimer() {
    this.interval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        this.timeLeft = 60;
      }
    }, 1000);

  }

  public confirm(): void {
    if (this.data.type == 'roomId') {
      this.router.navigate(['/room', this.data.value]);
      this.heartbeatService.startwithHeartBeat(this.data.value);
      this.dialogRef.close();
    }
  }

  public cancel(): void {
    this.router.navigate(['/']);
    this.dialogRef.close();
  }
}
