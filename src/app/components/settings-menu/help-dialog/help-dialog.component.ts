import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IconDefinition } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-help-dialog',
  templateUrl: 'help-dialog.component.html',
  styleUrls: ['./help-dialog.component.css']
})
export class HelpDialogComponent {
  constructor(public dialogRef: MatDialogRef<HelpDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: HelpDialogData) {}

  onClose(): void {
    this.dialogRef.close();
  }
}

export interface HelpDialogData {
  version: string;
  githubIcon: IconDefinition;
  year: number;
  isLightTheme: boolean;
}
