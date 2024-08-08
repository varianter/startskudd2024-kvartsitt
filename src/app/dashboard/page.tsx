"use client";
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import Typography from '@/components/ui/typography';
import moment from 'moment-timezone';
import Image from 'next/image';

moment.locale('no');

interface Sensor {
  sensorId: string;
  status: string;
  readingDate: string;
  deltaMovementInMm: string;
}

const Dashboard: React.FC = () => {
  const [latestSensors, setLatestSensors] = useState<Sensor[]>([]);
  const [numberOfAlerts, setNumberOfAlerts] = useState<number>(0);
  
  
  useEffect(() => {
    const setData = async () => {
      const response = await fetch('/api/sensors');
      const data = await response.json();
      setLatestSensors(data.latestSensorsData);
      setNumberOfAlerts(data.alertCounts);
    }
    setData();
    const interval = setInterval(async () => {
      setData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  

  return (
    <main className="grid grid-cols-3 gap-4 p-4 md:gap-8 md:p-8">
      <div className="col-span-full">
        <Typography variant="h1">Dashboard</Typography>
      </div>

      <div className="col-start-1 col-end-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-black font-semibold">Sensor</TableHead>
              <TableHead className="text-black font-semibold">Status</TableHead>
              <TableHead className="text-black font-semibold">Siste Måling</TableHead>
              <TableHead className="text-right text-black font-semibold">Bevegelse</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="">
            {latestSensors.map((sensor: Sensor) => (
              <TableRow key={sensor.sensorId}>
                <TableCell className="text-left">{"Sensor " + sensor.sensorId.slice(7)}</TableCell>
                <TableCell className="flex items-center gap-2">
                  <div>
                    {sensor.status === "ON" ? (
                      <Image src="/EllipseOn.svg" width={15} height={15} alt="" />
                    ) : sensor.status === "OFF" ? (
                      <Image src="/EllipseOff.svg" width={15} height={15} alt="" />
                    ) : (
                      <Image src="/EllipseErr.svg" width={15} height={15} alt="" />
                    )}
                  </div>
                  <div>{sensor.status}</div>
                </TableCell>
                <TableCell>{moment(sensor.readingDate).tz('Etc/GMT-2').format("DD.MM.YY HH:mm:ss")}</TableCell>
                <TableCell
                  className={`text-right ${
                    sensor.deltaMovementInMm !== undefined &&
                    parseFloat(sensor.deltaMovementInMm) > 5
                      ? "text-[#FF0000] text-right" 
                      : "text-right"
                  }`}
                      >
              {sensor.deltaMovementInMm === undefined
              ? "-" // Display '-' if undefined
              : parseFloat(sensor.deltaMovementInMm).toFixed(2) + " mm"}
</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="col-start-3 col-end-7">
        <Card x-chunk="dashboard-01-chunk-5" className="w-96 h-96 mx-auto flex flex-col items-center justify-center">
          <CardContent className="gap-2 flex flex-col items-center justify-center text-center">
            {numberOfAlerts >= 10 ? (
              <>
                <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M48.75 67.5C48.75 69.5711 47.0711 71.25 45 71.25C42.9289 71.25 41.25 69.5711 41.25 67.5C41.25 65.4289 42.9289 63.75 45 63.75C47.0711 63.75 48.75 65.4289 48.75 67.5Z" fill="#FF0000" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M45 7.5C46.3619 7.5 47.6167 8.23834 48.2781 9.42884L85.7781 76.9288C86.4234 78.0903 86.4058 79.5066 85.732 80.6517C85.0582 81.7969 83.8287 82.5 82.5 82.5H7.5C6.1713 82.5 4.9418 81.7969 4.26798 80.6517C3.59416 79.5066 3.57664 78.0903 4.22191 76.9288L41.7219 9.42884C42.3833 8.23834 43.6381 7.5 45 7.5ZM13.8732 75H76.1268L45 18.9717L13.8732 75ZM45 33.75C47.0711 33.75 48.75 35.4289 48.75 37.5V52.5C48.75 54.5711 47.0711 56.25 45 56.25C42.9289 56.25 41.25 54.5711 41.25 52.5V37.5C41.25 35.4289 42.9289 33.75 45 33.75Z" fill="#FF0000" />
                </svg>
                <CardTitle className="text-[#FF0000] text-4xl">
                  Rasfare
                </CardTitle>
                <CardDescription>
                  Veien må stenges!
                </CardDescription>
              </>
            ) : (
              <>
                <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M45 60C48.9782 60 52.7936 58.4196 55.6066 55.6066C58.4196 52.7936 60 48.9782 60 45C60 41.0218 58.4196 37.2064 55.6066 34.3934C52.7936 31.5804 48.9782 30 45 30C41.0218 30 37.2064 31.5804 34.3934 34.3934C31.5804 37.2064 30 41.0218 30 45C30 48.9782 31.5804 52.7936 34.3934 55.6066C37.2064 58.4196 41.0218 60 45 60Z" stroke="#FC75FF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M45 11.25V15" stroke="#FC75FF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M45 75V78.75" stroke="#FC75FF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11.25 45H15" stroke="#FC75FF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M75 45H78.75" stroke="#FC75FF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
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
};

export default Dashboard;
