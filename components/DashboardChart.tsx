"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import type { ChartData } from "@/lib/dashboard";

type Props = {
  data: ChartData[];
};

export default function DashboardChart({
  data,
}: Props) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 5,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            strokeOpacity={0.12}
          />

          <XAxis
            dataKey="label"
            tick={{
              fontSize: 10,
            }}
            interval={
              data.length > 15 ? 2 : 0
            }
          />

          <YAxis
            tick={{
              fontSize: 10,
            }}
          />

          <Tooltip
            formatter={(value, name) => [
              `৳ ${Number(value).toLocaleString(
                "en-BD"
              )}`,
              name === "due"
                ? "বাকি"
                : "জমা",
            ]}
          />

          <Bar
            dataKey="due"
            name="due"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
          />

          <Bar
            dataKey="payment"
            name="payment"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}