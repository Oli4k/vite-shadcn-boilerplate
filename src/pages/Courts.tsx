import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Calendar, Wrench } from "lucide-react";

const courts = [
  {
    id: 1,
    name: "Court 1",
    type: "Tennis",
    status: "Available",
    lastMaintenance: "2024-03-15",
    nextMaintenance: "2024-05-15",
    surface: "Hard",
    lights: true,
  },
  {
    id: 2,
    name: "Court 2",
    type: "Padel",
    status: "Booked",
    lastMaintenance: "2024-03-20",
    nextMaintenance: "2024-05-20",
    surface: "Artificial Grass",
    lights: true,
  },
  {
    id: 3,
    name: "Court 3",
    type: "Tennis",
    status: "Maintenance",
    lastMaintenance: "2024-04-01",
    nextMaintenance: "2024-06-01",
    surface: "Clay",
    lights: false,
  },
  {
    id: 4,
    name: "Court 4",
    type: "Padel",
    status: "Available",
    lastMaintenance: "2024-03-25",
    nextMaintenance: "2024-05-25",
    surface: "Artificial Grass",
    lights: true,
  },
];

export function Courts() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredCourts = courts.filter((court) => {
    const matchesStatus =
      statusFilter === "all" || court.status === statusFilter;
    const matchesType = typeFilter === "all" || court.type === typeFilter;
    return matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Courts</h2>
          <p className="text-muted-foreground">
            Manage your tennis and padel courts
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Court
        </Button>
      </div>

      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Booked">Booked</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Court Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Tennis">Tennis</SelectItem>
            <SelectItem value="Padel">Padel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Surface</TableHead>
              <TableHead>Facilities</TableHead>
              <TableHead>Maintenance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCourts.map((court) => (
              <TableRow key={court.id}>
                <TableCell className="font-medium">{court.name}</TableCell>
                <TableCell>{court.type}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      court.status === "Available"
                        ? "default"
                        : court.status === "Booked"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {court.status}
                  </Badge>
                </TableCell>
                <TableCell>{court.surface}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {court.lights && (
                      <Badge variant="outline">Lights</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Last: {court.lastMaintenance}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Next: {court.nextMaintenance}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 