import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import {HttpClient, HttpParams} from "@angular/common/http";

@Component({
  selector: 'ngx-predict-area-stack',
  template: `
    <div class="control-panel">
      <button nbButton status="primary" (click)="fetchAndShowData()" [disabled]="isLoading">
        <span *ngIf="!isLoading">Show Prediction</span>
        <span *ngIf="isLoading">
          <nb-spinner size="tiny" status="info"></nb-spinner> Loading...
        </span>
      </button>
    </div>
    <div *ngIf="isLoading" class="loading-container">
      <nb-spinner></nb-spinner>
      <p>Loading prediction data...</p>
    </div>
    <div *ngIf="showChart && !isLoading" echarts [options]="options" class="echart"></div>
  `,
  styles: [`
    .control-panel {
      margin-bottom: 16px;
    }
    .echart {
      margin-top: 16px;
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }
    .loading-container p {
      margin-top: 1rem;
    }
  `]
})
export class PredictAreaStackComponent implements OnInit, AfterViewInit, OnDestroy {
  options: any = {};
  themeSubscription: any;
  data: any;
  themeConfig: any;
  showChart: boolean = false;
  isLoading: boolean = false;

  constructor(private theme: NbThemeService, private http: HttpClient) {
  }

  ngOnInit() {
    // No longer making the HTTP request immediately
    // Instead, it will be triggered by the button
  }

  ngAfterViewInit() {
    this.themeSubscription = this.theme.getJsTheme().subscribe(config => {
      this.themeConfig = config;
      // Only update the chart if we have data
      if (this.data) {
        this.updateChartOptions();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  fetchAndShowData() {
    // Set loading state
    this.isLoading = true;
    this.showChart = false;

    // Get data
    this.getData();
  }

  updateChartOptions() {
    if (!this.themeConfig) {
      return;
    }

    const colors: any = this.themeConfig.variables;
    const echarts: any = this.themeConfig.variables.echarts;

    // Default x-axis data
    let timeData = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00'];

    // Default series data
    let congSuatMBData = [120, 132, 101, 134, 90, 230, 210];
    let congSuatMNData = [220, 182, 191, 234, 290, 330, 310];
    let congSuatMTData = [150, 232, 201, 154, 190, 330, 410];

    // If we have API data, use it
    if (this.data && this.data.result && this.data.result.data && this.data.result.data.phuTais) {
      const phuTais = this.data.result.data.phuTais;

      // Extract time data for x-axis
      timeData = phuTais.map(item => {
        if (item.thoiGian) {
          const date = new Date(item.thoiGian);
          return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
        return '';
      });

      // Extract data for each region
      congSuatMBData = phuTais.map(item => item.congSuatMB || 0);
      congSuatMNData = phuTais.map(item => item.congSuatMN || 0);
      congSuatMTData = phuTais.map(item => item.congSuatMT || 0);
    }

    this.options = {
      backgroundColor: echarts.bg,
      color: [colors.warningLight, colors.infoLight, colors.dangerLight],
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: echarts.tooltipBackgroundColor,
          },
        },
      },
      legend: {
        data: ['Miền Bắc', 'Miền Nam', 'Miền Trung'],
        textStyle: {
          color: echarts.textColor,
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: timeData,
          axisTick: {
            alignWithLabel: true,
          },
          axisLine: {
            lineStyle: {
              color: echarts.axisLineColor,
            },
          },
          axisLabel: {
            textStyle: {
              color: echarts.textColor,
            },
            rotate: 45,
          },
        },
      ],
      yAxis: [
        {
          type: 'value',
          name: 'Công suất (MW)',
          nameTextStyle: {
            color: echarts.textColor,
          },
          axisLine: {
            lineStyle: {
              color: echarts.axisLineColor,
            },
          },
          splitLine: {
            lineStyle: {
              color: echarts.splitLineColor,
            },
          },
          axisLabel: {
            textStyle: {
              color: echarts.textColor,
            },
            formatter: '{value} MW',
          },
        },
      ],
      series: [
        {
          name: 'Miền Bắc',
          type: 'line',
          stack: 'Công suất',
          areaStyle: { normal: { opacity: echarts.areaOpacity } },
          data: congSuatMBData,
        },
        {
          name: 'Miền Nam',
          type: 'line',
          stack: 'Công suất',
          areaStyle: { normal: { opacity: echarts.areaOpacity } },
          data: congSuatMNData,
        },
        {
          name: 'Miền Trung',
          type: 'line',
          stack: 'Công suất',
          areaStyle: { normal: { opacity: echarts.areaOpacity } },
          data: congSuatMTData,
        },
      ],
    };
  }

  getData() {
    // Create HttpParams object with the required parameters
    const params = new HttpParams()
      .set('day', '02/05/2025');

    // Make the HTTP request with the parameters
    this.http.get('http://127.0.0.1:5000/predict', { params })
      .subscribe(
        (response) => {
          this.data = response;
          console.log('Data received:', this.data);
          // Now that we have data, update the chart
          this.updateChartOptions();
          // Show the chart and hide loading indicator
          this.showChart = true;
          this.isLoading = false;
        },
        (error) => {
          console.error('Error fetching data:', error);
          // Handle error state
          this.showChart = false;
          this.isLoading = false;
          // You could also add an error message here
        },
      );
  }

  // Helper method to format date as YYYY-MM-DD
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
