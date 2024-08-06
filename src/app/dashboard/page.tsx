import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Typography from "@/components/ui/typography";
import { connect, getConnectionInfo } from "@/elastic";

export const revalidate = 20;

interface Sensor {
  sensorId: string;
  status: string;
  readingDate: string;
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
            size: 20,  // Number of unique sensorIds to fetch
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
                  includes: ['sensorId', 'status', 'readingDate']
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
  const sensorReading = sensorResponse.aggregations?.["unique_sensor_ids"]["buckets"]
  console.log(sensorReading)
  

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Typography variant="h1">Dashboard</Typography>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card x-chunk="dashboard-01-chunk-5">
          <CardHeader>
            <CardTitle className="gap-2 flex">
              Connection status
              {connectionData.connected ? (
                <Badge variant="default">Connected</Badge>
              ) : (
                <Badge variant="destructive">Not connected</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8">
            {connectionData.connected ? (
              <p>
                Connected to cluster{" "}
                <code className="bg-slate-200 p-1 font-mono rounded-sm">
                  {connectionData.clusterName}
                </code>
                . Counting {numberOfDocuments?.count} documents
              </p>
            ) : (
              <p>Not connected</p>
            )}
          </CardContent>
        </Card>
      </div>


      <div>

      </div>
    </main>
  );
}
