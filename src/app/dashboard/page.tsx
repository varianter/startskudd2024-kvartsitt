import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Typography from "@/components/ui/typography";
import { connect, getConnectionInfo } from "@/elastic";
import moment from "moment";
import Image from "next/image";
moment.locale("no");
export const revalidate = 20;

interface Sensor {
  sensorId: string;
  status: string;
  readingDate: string;
  deltaMovementInMm: string;
}

export default async function Dashboard() {
  const client = await connect();
  const connectionData = await getConnectionInfo();
  const numberOfDocuments = connectionData.connected
    ? await client.count()
    : null;

  const sensors = await client.search({index: "sensor_readings", size: 20})


  const sensorResponse = await client.search({
    index: 'sensor_readings',
    size: 0,  // No need to fetch actual documents
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

  const last24Hours = await client.search({
    index: 'sensor_readings_staging',
    body: {
      query: {
        bool: {
          must: [
            {
              range: {
                readingDate: {
                  gte: 'now-24h',
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
    }
  });


  // @ts-ignore
  const sensorReading = sensorResponse.aggregations?.["unique_sensor_ids"]["buckets"]
  const latestSensors = sensorReading.map((sensor: any) => sensor.latest_reading.hits.hits[0]._source)


  const numberOfAlerts = last24Hours.hits.hits.filter((sensor: any) => sensor._source.deltaMovementInMm > 5).length
  console.log(numberOfAlerts)



  return (
    <main className="grid grid-cols-3 gap-4 p-4 md:gap-8 md:p-8">
      <div className="col-span-full">
        <Typography variant="h1">Dashboard</Typography>
      </div>


      <div className="col-start-1 col-end-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sensor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last reading</TableHead>
              <TableHead>Bevegelse</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="">
            {latestSensors.map((sensor: Sensor) => (
              <TableRow key={sensor.sensorId} className="">
                <TableCell>{"Sensor " + sensor.sensorId.slice(7)}</TableCell>
                <TableCell className="flex items-center text-left gap-2">
                  <div>
                    {sensor.status == "ON" ? (
                      <Image src="/EllipseOn.svg" width={15} height={15} alt="" />
                    ) : sensor.status == "OFF" ? (
                      <Image src="/EllipseOff.svg" width={15} height={15} alt="" />
                    ) : (
                      <Image src="/EllipseErr.svg" width={15} height={15} alt="" />
                    )}</div>
                  <div>{sensor.status}</div>
                </TableCell>
                <TableCell>{moment(sensor.readingDate).format("DD.MM.YY HH:mm:ss")}</TableCell>
                <TableCell className="text-left">{sensor.deltaMovementInMm == undefined ? (
                  "Ingen data") : (
                  parseFloat(sensor.deltaMovementInMm).toFixed(2) + " mm"
                )}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="col-start-3 col-end-7">
        <Card x-chunk="dashboard-01-chunk-5" className="w-96 h-64 mx-auto flex flex-col items-center justify-center">
          <CardContent className="gap-2 flex flex-col items-center justify-center text-center">
            {numberOfAlerts >= 10 ? (
              <>
                <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M48.75 67.5C48.75 69.5711 47.0711 71.25 45 71.25C42.9289 71.25 41.25 69.5711 41.25 67.5C41.25 65.4289 42.9289 63.75 45 63.75C47.0711 63.75 48.75 65.4289 48.75 67.5Z" fill="#FF0000" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M45 7.5C46.3619 7.5 47.6167 8.23834 48.2781 9.42884L85.7781 76.9288C86.4234 78.0903 86.4058 79.5066 85.732 80.6517C85.0582 81.7969 83.8287 82.5 82.5 82.5H7.5C6.1713 82.5 4.9418 81.7969 4.26798 80.6517C3.59416 79.5066 3.57664 78.0903 4.22191 76.9288L41.7219 9.42884C42.3833 8.23834 43.6381 7.5 45 7.5ZM13.8732 75H76.1268L45 18.9717L13.8732 75ZM45 33.75C47.0711 33.75 48.75 35.4289 48.75 37.5V52.5C48.75 54.5711 47.0711 56.25 45 56.25C42.9289 56.25 41.25 54.5711 41.25 52.5V37.5C41.25 35.4289 42.9289 33.75 45 33.75Z" fill="#FF0000" />
                </svg>
                <CardTitle>
                  <p>Rasfare</p>
                </CardTitle>
                <CardDescription>
                  Veien må stenges!
                </CardDescription>
              </>
            ) : (
              <>
                <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M45 60C48.9782 60 52.7936 58.4196 55.6066 55.6066C58.4196 52.7936 60 48.9782 60 45C60 41.0218 58.4196 37.2064 55.6066 34.3934C52.7936 31.5804 48.9782 30 45 30C41.0218 30 37.2064 31.5804 34.3934 34.3934C31.5804 37.2064 30 41.0218 30 45C30 48.9782 31.5804 52.7936 34.3934 55.6066C37.2064 58.4196 41.0218 60 45 60Z" stroke="#FC75FF" strokeWidth="6" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M45 11.25V15" stroke="#FC75FF" strokeWidth="6" strokeLinecap="round" stroke-linejoin="round" />
                  <path d="M45 75V78.75" stroke="#FC75FF" strokeWidth="6" strokeLinecap="round" stroke-linejoin="round" />
                  <path d="M11.25 45H15" stroke="#FC75FF" strokeWidth="6" strokeLinecap="round" stroke-linejoin="round" />
                  <path d="M75 45H78.75" stroke="#FC75FF" strokeWidth="6" strokeLinecap="round" stroke-linejoin="round" />
                  <path d="M68.865 21.135L66.2137 23.7862" stroke="#FC75FF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M23.7863 66.2137L21.135 68.865" stroke="#FC75FF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21.135 21.135L23.7863 23.7862" stroke="#FC75FF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M66.2137 66.2137L68.865 68.865" stroke="#FC75FF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>


                <CardTitle>
                  <p>Ingen rasfare</p>
                </CardTitle>
                <CardDescription>
                  Veien kan åpnes.
                </CardDescription>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
