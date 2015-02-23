<div class="row">
    <div class="col-md-12">
        <h1>MultiAccount Detector</h1>
    </div>
</div>

<div class="row" style="padding:10px">
   <p><h2>Detecciones:  (<a href="#" onclick="deleteMultiAccountMessages()">Borrar Todas</a>) </h2> </p>
   <div id="multiaccountMessages"></div>   
</div>

<script>
    socket.emit('admin.getMultiAccountMessages',{}, function(err, data){
        console.log(data);
        var messages = "";
        if(!data)
            $("#multiaccountMessages").html("<b>No hay detecciones</b>");
        for(var i=0;i<data.members.length;i++)
        {
            var actualInfo = JSON.parse(data.members[i]);
            var actionColor = "";
            if( actualInfo[4] )
                actionColor = "red";
            else
                actionColor = "black";

            if( actualInfo[2] )
            {
                messages += "<b>Los usuarios <a href='/user/"+actualInfo[0]+"' target='_blank'>"+actualInfo[0]+"</a> y <a href='/user/"+actualInfo[1]+"' target='_blank'>"+actualInfo[1]+"</a> usan la misma IP ("+actualInfo[2]+") - "+humanReadableTime(actualInfo[3])+" [<font color='"+actionColor+"'>Accion Tomada: "+actualInfo[4]+"</font>]</b><br>";
            }
            else
            {
                messages += "<b>Los usuarios <a href='/user/"+actualInfo[0]+"' target='_blank'>"+actualInfo[0]+"</a> y <a href='/user/"+actualInfo[1]+"' target='_blank'>"+actualInfo[1]+"</a> usan el mismo navegador - "+humanReadableTime(actualInfo[3])+" [<font color='"+actionColor+"'>Accion Tomada: "+actualInfo[4]+"</font>]</b><br>";
            }
        }
        $("#multiaccountMessages").html(messages);
    });

    function deleteMultiAccountMessages()
    {
        if(confirm("Seguro que deseas borrar todas las detecciones?"))
        {
            socket.emit('admin.deleteMultiAccountMessages',{}, function(err, data){
                console.log(data);
                if(err)
                {
                    $("#multiaccountMessages").html("Error: "+err);
                }
                else
                {
                    $("#multiaccountMessages").html("Detecciones borradas!");
                }
            });
        }
    }

    function humanReadableTime(data){
        return moment(data, "x").format("hh:mm:ss - DD/MM/YY");
    }
</script>