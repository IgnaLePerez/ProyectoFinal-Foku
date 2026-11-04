namespace Foku.Models;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using Google.Apis.Util.Store;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

public class Calendar{

    public async Task<Events> GetEventos(){
        var eventosDemo = new Events {
            Items = new List<Event>
            {
                new Event {
                    Id = "demo-1",
                    Summary = "Reunión de equipo",
                    Start = new EventDateTime { DateTime = DateTime.Now.AddDays(1).Date.AddHours(9).AddMinutes(30) },
                    End = new EventDateTime { DateTime = DateTime.Now.AddDays(1).Date.AddHours(10).AddMinutes(45) }
                },
                new Event {
                    Id = "demo-2",
                    Summary = "Entrega del proyecto",
                    Start = new EventDateTime { Date = DateTime.Now.AddDays(3).ToString("yyyy-MM-dd") },
                    End = new EventDateTime { Date = DateTime.Now.AddDays(4).ToString("yyyy-MM-dd") }
                },
                new Event {
                    Id = "demo-3",
                    Summary = "Sesión de revisión",
                    Start = new EventDateTime { DateTime = DateTime.Now.AddDays(5).Date.AddHours(15) },
                    End = new EventDateTime { DateTime = DateTime.Now.AddDays(5).Date.AddHours(16).AddMinutes(30) }
                },
                new Event {
                    Id = "demo-4",
                    Summary = "Tarea importante",
                    Start = new EventDateTime { Date = DateTime.Now.AddDays(7).ToString("yyyy-MM-dd") },
                    End = new EventDateTime { Date = DateTime.Now.AddDays(8).ToString("yyyy-MM-dd") }
                }
            }
        };

        if (!File.Exists("wwwroot/client_secrets.json"))
        {
            return eventosDemo;
        }

        try
        {
            UserCredential credential;

            // 1. Cargar las credenciales del archivo JSON descargado de Google Cloud
            using (var stream = new FileStream("wwwroot/client_secrets.json", FileMode.Open, FileAccess.Read))
            {
                // El FileDataStore guardará los tokens localmente en una carpeta para no pedir login cada vez
                string credPath = "token.json";
                credential = await GoogleWebAuthorizationBroker.AuthorizeAsync(
                    GoogleClientSecrets.FromStream(stream).Secrets,
                    new[] { CalendarService.Scope.CalendarReadonly }, // Permiso de solo lectura
                    "user", // ID del usuario actual en tu sistema (puedes dinamizarlo)
                    CancellationToken.None,
                    new FileDataStore(credPath, true));

                    Console.WriteLine(credential);
            }

            // 2. Inicializar el servicio de la API de Google Calendar
            var service = new CalendarService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credential,
                ApplicationName = "Mi App MVC .NET",
            });

            // 3. Configurar la petición GET para listar los eventos
            EventsResource.ListRequest request = service.Events.List("primary");
            request.TimeMinDateTimeOffset = DateTimeOffset.Now; // Traer eventos desde este momento en adelante
            request.MaxResults = 10;                            // Limitar a los próximos 10 eventos
            request.SingleEvents = true;                        // Expandir eventos recurrentes en citas individuales
            request.OrderBy = EventsResource.ListRequest.OrderByEnum.StartTime;

            // 4. Ejecutar la petición a Google
            Events events = await request.ExecuteAsync();

            return events ?? eventosDemo;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error obteniendo eventos del calendario: {ex.Message}");
            return eventosDemo;
        }
    }

    public Calendar(){

    }
}