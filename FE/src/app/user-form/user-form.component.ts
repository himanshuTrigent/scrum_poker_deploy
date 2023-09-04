import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { emojiData } from '../shared/app-data/emoji-data';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css'],
})
export class UserFormComponent implements OnInit {
  public emojiData = emojiData;
  public selectedValue!: string;

  public userFormGroup = new FormGroup({
    displayName: new FormControl({ value: '', disabled: this.data.displayName != '' }, [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(30),
    ]),
    selectedJobRole: new FormControl(
      '',
      [Validators.required]
    ),
  });

  constructor(
    public dialogRef: MatDialogRef<UserFormComponent>,
    private router : Router,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      role: string;
      img: string;
      disable: boolean;
      displayName: string;
    }
  ) {}

  ngOnInit() {
    if (this.data && this.data.role == 'Scrum Master') {
      this.selectedJobRole.setValue(this.data.role);
    }

    if (this.data.displayName != '') {
      this.displayName.setValue(this.data.displayName);
    }
  }

  get displayName() {
    return this.userFormGroup.get('displayName') as FormControl;
  }
  get selectedJobRole() {
    return this.userFormGroup.get('selectedJobRole') as FormControl;
  }

  public getErrorMessage(): string | void {
    if (
      this.displayName.hasError('required') ||
      this.displayName.hasError('minlength')
    )
      return 'Name should have atleast 2 characters';

    if (this.displayName.hasError('maxlength'))
      return 'Your name should not be greater than 15 characters';
  }

  public getSelectedJobRoleErrorMessage(): string | void {
    if (this.selectedJobRole.hasError('required')) {
      return 'It is Required To Choose your job role';
    }
  }
  
  public onRoleSelected(): void {
    this.selectedValue = this.selectedJobRole.value;
    for (let roles of emojiData) {
      if (roles.role === this.selectedValue) {
        this.data.role = roles.role;
        this.data.img = roles.img;
      }
    }
  }
}
