import { connect, getConnectionInfo } from '@/elastic';
export async function GET(request: Request) {
    const client = await connect();
    const sensorResponse = await client.search({
        index: 'sensor_readings',
        size: 0,
        body: {
          aggs: {
            unique_sensor_ids: {
              composite: {
                size: 20,
                sources: [
                  {
                    sensorId: {
                      terms: {
                        field: 'sensorId'
                      }
                    }
                  }
                ]
              },
              aggs: {
                latest_reading: {
                  top_hits: {
                    sort: [
                      {
                        readingDate: {
                          order: 'desc'
                        }
                      }
                    ],
                    _source: {
                      includes: ['sensorId', 'status', 'readingDate', 'deltaMovementInMm']
                    },
                    size: 1
                  }
                }
              }
            }
          }
        }
    });
    // @ts-ignore
    const sensorReading = sensorResponse.aggregations?.["unique_sensor_ids"]["buckets"];
    const latestSensorsData = sensorReading.map((sensor: any) => sensor.latest_reading.hits.hits[0]._source);

    const last24Hours = await client.search({
        index: 'sensor_readings',
        body: {
        query: {
            bool: {
            must: [
                {
                range: {
                    readingDate: {
                    gte: 'now-3h',
                    }
                }
                },
                {
                range: {
                    deltaMovementInMm: {
                    gt: 5,
                    }
                }
                }
            ]
            }
        }
        }});
    const alertCounts = last24Hours.hits.hits.filter((sensor: any) => sensor._source.deltaMovementInMm > 5).length;
    return new Response(JSON.stringify({latestSensorsData: latestSensorsData, alertCounts: alertCounts}));
  }