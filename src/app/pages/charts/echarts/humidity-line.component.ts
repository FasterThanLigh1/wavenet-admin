import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import {HttpClient, HttpParams} from '@angular/common/http';

@Component({
  selector: 'ngx-humidity-line',
  template: `
    <div echarts [options]="options" class="echart"></div>
  `,
})
export class HumidityLineComponent implements OnInit, AfterViewInit, OnDestroy {
  options: any = {};
  themeSubscription: any;
  data: any;
  themeConfig: any; // Store the theme config

  constructor(private theme: NbThemeService, private http: HttpClient) {
  }

  ngOnInit() {
    // Make HTTP request when component initializes
    this.getData();
  }

  ngAfterViewInit() {
    this.themeSubscription = this.theme.getJsTheme().subscribe(config => {
      this.themeConfig = config; // Save the config for later use
      this.updateChartOptions();
    });
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  updateChartOptions() {
    // Only proceed if we have the theme config
    if (!this.themeConfig) {
      return;
    }

    const colors: any = this.themeConfig.variables;
    const echarts: any = this.themeConfig.variables.echarts;

    // Make sure echarts is defined
    if (!echarts) {
      console.error('Echarts configuration is missing from theme');
      return;
    }

    // Prepare x-axis data
    let xAxisData = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']; // Default

    // Default series data
    let daNangData = [1, 3, 9, 27, 81, 247, 741, 2223, 6669];
    let hoChiMinhData = [1, 3, 9, 27, 81, 247, 741, 2223, 6669];
    let haNoiData = [1, 3, 9, 27, 81, 247, 741, 2223, 6669];

    // If we have API data, use it
    if (this.data) {
      // Use Da Nang time data for X axis (all cities should have the same time points)
      if (this.data['Da Nang'] && this.data['Da Nang'].hourly && this.data['Da Nang'].hourly.time) {
        xAxisData = this.data['Da Nang'].hourly.time;
      }

      // Get humidity data for each city
      if (this.data['Da Nang'] && this.data['Da Nang'].hourly && this.data['Da Nang'].hourly.relative_humidity_2m) {
        daNangData = this.data['Da Nang'].hourly.relative_humidity_2m;
      }

      if (this.data['Ho Chi Minh City'] && this.data['Ho Chi Minh City'].hourly &&
        this.data['Ho Chi Minh City'].hourly.relative_humidity_2m) {
        hoChiMinhData = this.data['Ho Chi Minh City'].hourly.relative_humidity_2m;
      }

      if (this.data['Ha Noi'] && this.data['Ha Noi'].hourly &&
        this.data['Ha Noi'].hourly.relative_humidity_2m) {
        haNoiData = this.data['Ha Noi'].hourly.relative_humidity_2m;
      }
    }

    this.options = {
      backgroundColor: echarts.bg,
      color: [colors.danger, colors.primary, colors.info],
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          // Format the tooltip to show all series
          let result = '';
          if (params[0].axisValue && typeof params[0].axisValue === 'string' && params[0].axisValue.includes('T')) {
            const date = new Date(params[0].axisValue);
            result = date.toLocaleString() + '<br/>';
          } else {
            result = params[0].axisValue + '<br/>';
          }

          // Add each series value
          params.forEach(param => {
            result += param.marker + ' ' + param.seriesName + ': ' + param.value + '%<br/>';
          });

          return result;
        }
      },
      legend: {
        left: 'left',
        data: ['Da Nang', 'Ho Chi Minh City', 'Ha Noi'],
        textStyle: {
          color: echarts.textColor,
        },
      },
      xAxis: [
        {
          type: 'category',
          data: xAxisData,
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
            rotate: 45, // Rotate labels for better readability
            formatter: (value) => {
              // Format time values to be more readable if they are API timestamps
              if (value && typeof value === 'string' && value.includes('T')) {
                // Format like "May 3, 14:00" from "2025-05-03T14:00"
                const date = new Date(value);
                return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              }
              return value;
            }
          },
        },
      ],
      yAxis: [
        {
          type: 'value',  // Changed from 'log' to 'value' for humidity percentage
          min: 0,
          max: 100,  // Humidity is typically 0-100%
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
            formatter: '{value}%'  // Added % symbol to y-axis labels
          },
        },
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      series: [
        {
          name: 'Da Nang',
          type: 'line',
          data: daNangData,
          smooth: true,
        },
        {
          name: 'Ho Chi Minh City',
          type: 'line',
          data: hoChiMinhData,
          smooth: true,
        },
        {
          name: 'Ha Noi',
          type: 'line',
          data: haNoiData,
          smooth: true,
        }
      ],
    };
  }

  getData() {
    // Get yesterday's date for start_date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startDate = this.formatDate(yesterday);

    // Get date 7 days from yesterday for end_date
    const endDate = this.formatDate(yesterday);

    // Create HttpParams object with the required parameters
    const params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);

    // Make the HTTP request with the parameters
    this.http.get('http://127.0.0.1:5000/weather', { params })
      .subscribe(
        (response) => {
          this.data = response;
          console.log('Data received:', this.data);
          // Now that we have data, update the chart
          this.updateChartOptions();
        },
        (error) => {
          console.error('Error fetching data:', error);
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
