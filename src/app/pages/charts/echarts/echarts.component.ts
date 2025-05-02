import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'ngx-echarts',
  styleUrls: ['./echarts.component.scss'],
  templateUrl: './echarts.component.html',
})
export class EchartsComponent implements OnInit {
  data: any;
  constructor(private http: HttpClient) { }

  ngOnInit() {
    // Make HTTP request when component initializes
    this.getData();
  }

  getData() {
    this.http.get('http://127.0.0.1:5000/test')
      .subscribe(
        (response) => {
          this.data = response;
          console.log('Data received:', this.data);
        },
        (error) => {
          console.error('Error fetching data:', error);
        },
      );
  }
}
