namespace Foku.Models;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using Google.Apis.Util.Store;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

public class Calendar{

    public async Task<Events> GetEventos(){
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

        return events;
    }

    public Calendar(){

    }
}