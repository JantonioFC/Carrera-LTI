
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, BarChart3, Plus, Settings, Menu, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

interface Subject {
  id: string;
  name: string;
  color: string;
  weeklyHours: number;
  totalHours: number;
  studiedHours: number;
}

interface StudyEvent {
  id: string;
  subjectId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  completed: boolean;
}

const StudyScheduleApp = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studyEvents, setStudyEvents] = useState<StudyEvent[]>([]);
  const [currentView, setCurrentView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  // Subject colors
  const subjectColors = [
    '#EF4444', '#F97316', '#EAB308', '#22C55E', 
    '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'
  ];

  // Load data from localStorage
  useEffect(() => {
    const savedSubjects = localStorage.getItem('studySchedule_subjects');
    const savedEvents = localStorage.getItem('studySchedule_events');
    
    if (savedSubjects) {
      setSubjects(JSON.parse(savedSubjects));
    }
    if (savedEvents) {
      setStudyEvents(JSON.parse(savedEvents));
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('studySchedule_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('studySchedule_events', JSON.stringify(studyEvents));
  }, [studyEvents]);

  // Add new subject
  const addSubject = (name: string, weeklyHours: number, color: string) => {
    const newSubject: Subject = {
      id: Date.now().toString(),
      name,
      color,
      weeklyHours,
      totalHours: 0,
      studiedHours: 0
    };
    setSubjects([...subjects, newSubject]);
    toast({
      title: "Materia agregada",
      description: `${name} ha sido agregada exitosamente.`
    });
  };

  // Add study event
  const addStudyEvent = (subjectId: string, title: string, date: string, startTime: string, endTime: string) => {
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours

    const newEvent: StudyEvent = {
      id: Date.now().toString(),
      subjectId,
      title,
      date,
      startTime,
      endTime,
      duration,
      completed: false
    };

    setStudyEvents([...studyEvents, newEvent]);
    toast({
      title: "Evento creado",
      description: `Sesión de estudio programada para ${title}.`
    });
  };

  // Mark event as completed
  const completeEvent = (eventId: string) => {
    setStudyEvents(prev => 
      prev.map(event => {
        if (event.id === eventId && !event.completed) {
          const subject = subjects.find(s => s.id === event.subjectId);
          if (subject) {
            setSubjects(prevSubjects =>
              prevSubjects.map(s => 
                s.id === subject.id 
                  ? { ...s, studiedHours: s.studiedHours + event.duration }
                  : s
              )
            );
          }
          return { ...event, completed: true };
        }
        return event;
      })
    );
    toast({
      title: "¡Sesión completada!",
      description: "Has registrado tu tiempo de estudio."
    });
  };

  // Get week dates
  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  // Get events for specific date
  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return studyEvents.filter(event => event.date === dateString);
  };

  // Calculate study metrics
  const getStudyMetrics = () => {
    const totalPlannedHours = subjects.reduce((sum, subject) => sum + subject.weeklyHours, 0);
    const totalStudiedHours = subjects.reduce((sum, subject) => sum + subject.studiedHours, 0);
    const completionRate = totalPlannedHours > 0 ? (totalStudiedHours / totalPlannedHours) * 100 : 0;
    
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = studyEvents.filter(event => event.date === today);
    const todayHours = todayEvents.filter(event => event.completed).reduce((sum, event) => sum + event.duration, 0);

    return {
      totalPlannedHours,
      totalStudiedHours,
      completionRate,
      todayHours
    };
  };

  const weekDates = getWeekDates(currentDate);
  const metrics = getStudyMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-blue-900">StudyPlan</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as 'week' | 'month')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="week">Semana</TabsTrigger>
                  <TabsTrigger value="month">Mes</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Evento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuevo Evento de Estudio</DialogTitle>
                  </DialogHeader>
                  <AddEventForm 
                    subjects={subjects}
                    onAddEvent={addStudyEvent}
                    onClose={() => setIsAddEventOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
            <h2 className="text-lg font-semibold text-gray-900">Panel</h2>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Study Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-blue-900">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Métricas de Estudio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Progreso Semanal</span>
                    <span>{Math.round(metrics.completionRate)}%</span>
                  </div>
                  <Progress value={metrics.completionRate} className="mt-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{metrics.todayHours}</div>
                    <div className="text-xs text-blue-700">Horas Hoy</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{Math.round(metrics.totalStudiedHours)}</div>
                    <div className="text-xs text-orange-700">Total Horas</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subjects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-blue-900">
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Materias
                  </div>
                  <Dialog open={isAddSubjectOpen} onOpenChange={setIsAddSubjectOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nueva Materia</DialogTitle>
                      </DialogHeader>
                      <AddSubjectForm 
                        colors={subjectColors}
                        onAddSubject={addSubject}
                        onClose={() => setIsAddSubjectOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {subjects.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No hay materias agregadas
                  </p>
                ) : (
                  subjects.map(subject => (
                    <div key={subject.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        <div>
                          <div className="font-medium text-gray-900">{subject.name}</div>
                          <div className="text-xs text-gray-500">
                            {subject.studiedHours}h / {subject.weeklyHours}h semanales
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={(subject.studiedHours / subject.weeklyHours) * 100} 
                        className="w-12 h-2"
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setDate(currentDate.getDate() - (currentView === 'week' ? 7 : 30));
                    setCurrentDate(newDate);
                  }}
                >
                  ← Anterior
                </Button>
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentView === 'week' 
                    ? `Semana del ${weekDates[0].toLocaleDateString('es-ES')} - ${weekDates[6].toLocaleDateString('es-ES')}`
                    : currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                  }
                </h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setDate(currentDate.getDate() + (currentView === 'week' ? 7 : 30));
                    setCurrentDate(newDate);
                  }}
                >
                  Siguiente →
                </Button>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setCurrentDate(new Date())}
              >
                Hoy
              </Button>
            </div>

            {/* Calendar Grid */}
            {currentView === 'week' ? (
              <WeekView 
                weekDates={weekDates}
                studyEvents={studyEvents}
                subjects={subjects}
                onCompleteEvent={completeEvent}
                getEventsForDate={getEventsForDate}
              />
            ) : (
              <MonthView 
                currentDate={currentDate}
                studyEvents={studyEvents}
                subjects={subjects}
                onCompleteEvent={completeEvent}
                getEventsForDate={getEventsForDate}
              />
            )}
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

// Week View Component
const WeekView = ({ weekDates, studyEvents, subjects, onCompleteEvent, getEventsForDate }) => {
  // Create hours array from 17:00 to 06:00 (next day)
  const hours = [
    ...Array.from({ length: 8 }, (_, i) => i + 17), // 17, 18, 19, 20, 21, 22, 23
    ...Array.from({ length: 7 }, (_, i) => i) // 0, 1, 2, 3, 4, 5, 6
  ];

  const formatHour = (hour: number) => {
    if (hour === 0) return '00:00';
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="grid grid-cols-8 border-b border-gray-200">
        <div className="p-4 font-medium text-gray-700">Hora</div>
        {weekDates.map((date, index) => (
          <div key={index} className="p-4 text-center border-l border-gray-200">
            <div className="font-medium text-gray-900">
              {date.toLocaleDateString('es-ES', { weekday: 'short' })}
            </div>
            <div className="text-sm text-gray-500">
              {date.getDate()}
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-8">
        {hours.map(hour => (
          <React.Fragment key={hour}>
            <div className="p-4 text-sm text-gray-500 border-b border-gray-100">
              {formatHour(hour)}
            </div>
            {weekDates.map((date, dayIndex) => {
              const events = getEventsForDate(date).filter(event => {
                const eventHour = parseInt(event.startTime.split(':')[0]);
                return eventHour === hour;
              });

              return (
                <div key={dayIndex} className="min-h-16 p-2 border-l border-b border-gray-100">
                  {events.map(event => {
                    const subject = subjects.find(s => s.id === event.subjectId);
                    return (
                      <div
                        key={event.id}
                        className={`p-2 rounded-md text-xs cursor-pointer transition-opacity ${
                          event.completed ? 'opacity-60' : 'hover:opacity-80'
                        }`}
                        style={{ backgroundColor: subject?.color + '20', borderLeft: `3px solid ${subject?.color}` }}
                        onClick={() => !event.completed && onCompleteEvent(event.id)}
                      >
                        <div className="font-medium" style={{ color: subject?.color }}>
                          {event.title}
                        </div>
                        <div className="text-gray-600">
                          {event.startTime} - {event.endTime}
                        </div>
                        {event.completed && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Completado
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Month View Component
const MonthView = ({ currentDate, studyEvents, subjects, onCompleteEvent, getEventsForDate }) => {
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
  
  const days = [];
  const currentDateIterator = new Date(startDate);
  
  while (days.length < 42) {
    days.push(new Date(currentDateIterator));
    currentDateIterator.setDate(currentDateIterator.getDate() + 1);
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="p-4 text-center font-medium text-gray-700">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7">
        {days.map((date, index) => {
          const events = getEventsForDate(date);
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`min-h-24 p-2 border-b border-r border-gray-100 ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${isToday ? 'bg-blue-50' : ''}`}
            >
              <div className={`text-sm font-medium mb-1 ${
                isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              } ${isToday ? 'text-blue-600' : ''}`}>
                {date.getDate()}
              </div>
              
              <div className="space-y-1">
                {events.slice(0, 3).map(event => {
                  const subject = subjects.find(s => s.id === event.subjectId);
                  return (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded cursor-pointer transition-opacity ${
                        event.completed ? 'opacity-60' : 'hover:opacity-80'
                      }`}
                      style={{ backgroundColor: subject?.color + '20', color: subject?.color }}
                      onClick={() => !event.completed && onCompleteEvent(event.id)}
                    >
                      {event.title}
                    </div>
                  );
                })}
                {events.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{events.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Add Subject Form Component
const AddSubjectForm = ({ colors, onAddSubject, onClose }) => {
  const [name, setName] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('');
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && weeklyHours) {
      onAddSubject(name.trim(), parseInt(weeklyHours), selectedColor);
      setName('');
      setWeeklyHours('');
      setSelectedColor(colors[0]);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="subject-name">Nombre de la materia</Label>
        <Input
          id="subject-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Matemáticas"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="weekly-hours">Horas semanales</Label>
        <Input
          id="weekly-hours"
          type="number"
          value={weeklyHours}
          onChange={(e) => setWeeklyHours(e.target.value)}
          placeholder="Ej: 5"
          min="1"
          max="40"
          required
        />
      </div>
      
      <div>
        <Label>Color</Label>
        <div className="flex space-x-2 mt-2">
          {colors.map(color => (
            <button
              key={color}
              type="button"
              className={`w-8 h-8 rounded-full border-2 ${
                selectedColor === color ? 'border-gray-400' : 'border-gray-200'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Agregar Materia
        </Button>
      </div>
    </form>
  );
};

// Add Event Form Component
const AddEventForm = ({ subjects, onAddEvent, onClose }) => {
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subjectId && title.trim() && date && startTime && endTime) {
      onAddEvent(subjectId, title.trim(), date, startTime, endTime);
      setSubjectId('');
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setStartTime('');
      setEndTime('');
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="event-subject">Materia</Label>
        <Select value={subjectId} onValueChange={setSubjectId} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una materia" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map(subject => (
              <SelectItem key={subject.id} value={subject.id}>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span>{subject.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="event-title">Título del evento</Label>
        <Input
          id="event-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Repaso de álgebra"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="event-date">Fecha</Label>
        <Input
          id="event-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start-time">Hora inicio</Label>
          <Input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="end-time">Hora fin</Label>
          <Input
            id="end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Crear Evento
        </Button>
      </div>
    </form>
  );
};

export default StudyScheduleApp;
