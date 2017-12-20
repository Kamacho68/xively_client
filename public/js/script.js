$(document).ready(function() {
    
	/* START OF TAB-PANE */
    var navListItems = $('ul.setup-panel li a'),
        allWells = $('.setup-content');

    allWells.hide();

    navListItems.click(function(e)
    {
        e.preventDefault();
        var $target = $($(this).attr('href')),
            $item = $(this).closest('li');
        
        if (!$item.hasClass('disabled')) {
            navListItems.closest('li').removeClass('active');
            $item.addClass('active');
            allWells.hide();
            $target.show();
        }
    });
    
    $('ul.setup-panel li.active a').trigger('click');
    
    /* END OF TAB-PANE */
    
    /* START OF XIVELY */
    
    var mqtt_broker_url = '';
    var mqtt_client_id = '';
    var mqtt_port = '';
    var mqtt_path = 'mqtt';

    //Create a MQTT client instance 
    var mqtt_client ='';

    // Enable buttons only when all required fields are filled in 
    $('#loginForm input').keyup(function() {
    	var empty = false;
        $('#loginForm input').each(function() {
            if ($(this).val() == '') {
                empty = true;
            }
        });

        if (empty) {
        	$("#connect_to_broker").prop("disabled",true);
        } else {
        	$("#connect_to_broker").prop("disabled",false);
        }
    });
    
    $('#subscribeOwnForm input').keyup(function() {
    	var empty = false;
        $('#subscribeOwnForm input').each(function() {
            if ($(this).val() == '') {
                empty = true;
            }
        });

        if (empty) {
        	$("#subscribeOwn").prop("disabled",true);
        } else {
        	$("#subscribeOwn").prop("disabled",false);
        }
    });
    
    $('#subscribeForm input').keyup(function() {
    	var empty = false;
        $('#subscribeForm input').each(function() {
            if ($(this).val() == '') {
                empty = true;
            }
        });

        if (empty) {
        	$("#subscribe").prop("disabled",true);
        } else {
        	$("#subscribe").prop("disabled",false);
        }
    });
    
    $('#ownDeviceDetails').hide();

    $( "#selectOwn" ).change(function() {
    	
    	if ($(this).val() == "No") {
    		$('#ownDeviceDetails').hide();
    	} else {
    		$( "#subscribeOwnForm input[type='text']" ).prop('required', true);
    		$( "#subscribeOwnDeviceId" ).val($( "#username" ).val());
    		$('#ownDeviceDetails').show();
    	}
    });
    
  //Get Formatted time in Hour:Minute:Seconds AM/PM format
    function getFromattedTime() {
    	var dt = new Date();
    	var hours = dt.getHours() === 0 ? "12" : dt.getHours() > 12 ? dt.getHours() - 12 : dt.getHours();
    	var minutes = (dt.getMinutes() < 10 ? "0" : "") + dt.getMinutes();
    	var seconds = dt.getSeconds();
    	var ampm = dt.getHours() < 12 ? "AM" : "PM";
    	var formattedTime = hours + ":" + minutes + ":" + seconds + " " + ampm;
    	return formattedTime;
    }
    
  //called when the client loses its connection
    function onConnectionLost(responseObject) {
      if (responseObject.errorCode !== 0) {
    	  displayMessageConsole("Connection Lost with MQTT Broker. Error: " + "\"" +responseObject.errorMessage + "\"");
      }
    }

    //called when a message arrives
    function onMessageArrived(message) {
    	displayMessageConsole("Message Recieved: "  +  "\"" + message.payloadString + "\"" + " on channel/topic: " + "\"" + message.destinationName + "\"" + " QoS: " + "\"" + message.qos + "\"");
    } 

    //called when a message delivery
/*    function onMessageDelivered(message) {
    	displayMessageConsole("MQTT Message Ddelivered successfully. "  + " Message: " + "\"" +  message.payloadString + "\"" + " MQTT Topic: " + "\"" + message.destinationName + "\"" + " QoS Value: " + "\"" + message.qos + "\"");
    } */

    //called when the client connects
    function onConnect() {
    	
    	// enable and disable buttons
    	$("#connectToBroker").prop("disabled",true);
        $("#disconnectFromBroker").prop("disabled",false);
        
     	// enable subscriptions buttons
        $("#subscribe").prop("disabled",false);
        $("#subscribeOwn").prop("disabled",false);

        // enable publish button
        $("#publishMessage").prop("disabled",false);
        
        activateNextStep('#deviceSubscription'); // activate next tab-pane
        
      // Once a connection has been made, make a subscription and send a message.
      displayMessageConsole("Connection with MQTT Broker: " + "\"" + mqtt_broker_url + "\" established.");
    }
    
    function onConnectionFailure(event) {
    	displayMessageConsole("MQTT connection failure: " + "\"" + event.errorMessage + "\".");
    }
    
    function activateNextStep (nextTabId) {
    	
    	$('ul.setup-panel li:eq(1)').removeClass('disabled');
    	$('[href="'+nextTabId+'"]').tab('show');
    }
    
    function notempty(id) {
    	
    	var value = $("#"+id).val();
    	if (value.length < 1) {
    		return false;
    	} else {
    		return true;
    	}
    }
    
    // Check if the input fields are empty
    function check_required_fields(inputObj) {
    	
    	var isValid = true;
    	$(inputObj).each(function(){

    		if (!notempty($(this).attr('id'))) {
    			isValid = false;
    			return isValid;
    		}
    	});
    	return isValid;
    }

    //Connect the client
    $("#connect_to_broker").click(function () {
    	
    	//if (check_required_fields('#loginForm input[type=text]')) {
    	if (check_required_fields('#loginForm input')) {
    		
        	// Set the variables
        	mqtt_broker_url = $('input[name=brokerUrl]').val();
        	mqtt_client_id = '';
        	mqtt_port = Number(document.getElementById("port").value);
        	
        	var username = document.getElementById("username").value;
        	var password = document.getElementById("password").value;
        	
        	//Create a MQTT Client instance
        	mqtt_client = new Paho.MQTT.Client(mqtt_broker_url,mqtt_port, mqtt_client_id);
        	
         	// set callback handlers
        	mqtt_client.onConnectionLost = onConnectionLost;
        	mqtt_client.onMessageArrived = onMessageArrived;
        	mqtt_client.connect({
        		userName: username,
        		password: password,
        		useSSL: true,
        		onSuccess: onConnect,
        		onFailure: onConnectionFailure
        	});
    	}
    });

    //Disconnect the client
    $("#disconnectFromBroker").click(function () {
    	mqtt_client.disconnect();
    	
    	$("#disconnectFromBroker").prop("disabled", true);
        $("#connectToBroker").prop("disabled", false);
        
        $("#subscribe").prop("disabled", true);
        $("#unsubscribe").prop("disabled", true);
        
        $("#subscribeOwn").prop("disabled", true);
        $("#unsubscribeOwn").prop("disabled", true);
        
    	displayMessageConsole("MQTT Client is disconnected");
    });

    /* Subscribe to MQTT Topic/Channel */
    $("#subscribe").click(function () {
    	
    	var accountId = document.getElementById("accountId").value;
    	var deviceId = document.getElementById("subscribeDeviceId").value; // Username/Device id
    	var mqtt_topic =  document.getElementById("topicToSubscribe").value; // Topic/Channel to subscribe to
    	
    	// Set the publish details to be the same as the subscribed details
    	$("#publishDeviceId").val(deviceId);
    	$('#publishDeviceId').prop('readonly', true);
    	$("#topicToPublish").val(mqtt_topic);
    	$('#topicToPublish').prop('readonly', true);
    	
    	subscribeToTopic(accountId,deviceId,mqtt_topic);
    	$("#unsubscribe").prop("disabled", false);
    	$("#publishMessage").prop("disabled", false);
    	
    	activateNextStep('#messagePublishing'); // activate next tab-pane
    });

    $("#subscribeOwn").click(function () {
    	
    	var accountId = document.getElementById("accountId").value;
    	var deviceId = document.getElementById("subscribeOwnDeviceId").value; // Username/Device id
    	var mqtt_topic =  document.getElementById("ownTopicToSubscribe").value; // Topic/Channel to subscribe to

    	subscribeToTopic(accountId,deviceId,mqtt_topic);
    	$("#unsubscribeOwn").prop("disabled", false);
    });

    function subscribeToTopic(accountId, deviceId, mqtt_topic) {
    	
    	mqtt_client.subscribe("xi/blue/v1/" + accountId + "/d/" + deviceId + "/" + mqtt_topic, {
    		qos: 0,
    		invocationContext: {
    			topic: mqtt_topic
    		},
    		onSuccess: onTopicSubscribedSuccess,
    		onFailure: onTopicSubscribedFailure
    	});
    }

    function onTopicSubscribedSuccess(response) {
    	
    	if (response != null) {

    		displayMessageConsole("Subscribed to " + "\"" + response.invocationContext.topic + "\" topic/channel.");
    		//console.log("invocationContextc: " + "\"" + JSON.stringify(response) + "\"");
    	} else {
    		displayMessageConsole("Topic subscribed successfully");
    	}
    }

    function onTopicSubscribedFailure(response) {
    	if (response != null) {
    		displayMessageConsole("Couldn\'t subscribe to '" + response.invocationContext.topic + "' topic/channel.");
    	} else {
    		displayMessageConsole("Topic could not be subscribed to.");
    	}
    }

    /* Unsubscribe from topic/channel */
    $("#unsubscribe").click(function () {
    	var accountId = document.getElementById("accountId").value;
    	var deviceId = document.getElementById("subscribeDeviceId").value; // Username/Device id
    	var mqtt_topic =  document.getElementById("topicToSubscribe").value; // Topic/Channel to unsubscribe from
    	
    	unsubscribeFromTopic(accountId,deviceId,mqtt_topic);
    	
    	$("#unsubscribe").prop("disabled", true);
    	$("#subscribe").prop("disabled", false);
    	$("#publishMessage").prop("disabled", true);
    });

    $("#unsubscribeOwn").click(function () {
    	var accountId = document.getElementById("accountId").value;
    	var deviceId = document.getElementById("subscribeOwnDeviceId").value; // Username/Device id
    	var mqtt_topic =  document.getElementById("ownTopicToSubscribe").value; // Topic/Channel to subscribe to
    	
    	unsubscribeFromTopic(accountId,deviceId,mqtt_topic);
    	
    	$("#unsubscribeOwn").prop("disabled", true);
    	$("#subscribeOwn").prop("disabled", false);
    });

    function unsubscribeFromTopic (accountId, deviceId, mqtt_topic) {
    	
    	mqtt_client.unsubscribe("xi/blue/v1/" + accountId + "/d/" + deviceId + "/" + mqtt_topic, {
    	    invocationContext: {
                topic: mqtt_topic
            },
            onSuccess: onTopicUnsubscribedSuccess,
            onFailure: onTopicUnsubscribedFailure
    	});
    }

    function onTopicUnsubscribedSuccess(response) {
    	if (response != null) {
    		displayMessageConsole("unsubscribed successfully to '" + response.invocationContext.topic + "' topic/channel");
    	} else {
    		displayMessageConsole("Topic unsubscribed successfully");
    	}
    }

    function onTopicUnsubscribedFailure(response) {
    	if (response != null) {
    		displayMessageConsole("Couldn\'t unsubscribed to '" + response.invocationContext.topic + "' topic/channel.");
    	} else {
    		displayMessageConsole("Topic could not be unsubscribed");
    	}
    }

    /* Publish Message */
    $("#publishMessage").click(function () {
    	
    	var accountId = document.getElementById("accountId").value;
    	var deviceId = document.getElementById("publishDeviceId").value; // Username/Device id
    	var payload = document.getElementById("payload").value; // payload, message to publish
    	var topicToPublish = document.getElementById("topicToPublish").value; //topic/channel to publish to
    	
    	var topic = "xi/blue/v1/" + accountId + "/d/" + deviceId + "/";
    	
    		if (topicToPublish != "") {
    		topic += topicToPublish;
    	} else {
    		alert('No topic was porvided');
    		return;
    	}
    	mqtt_client.send(
    			topic,
    			payload,
    			0,
    			false
    	);
    	displayMessageConsole("Published into topic '" + topic + "': " + payload);
    });

    //Set MQTT Messages to TextArea
    function displayMessageConsole(text) {
    	document.getElementById("mqttLog").value = document.getElementById("mqttLog").value + getFromattedTime().toString() + ":  " + text + "\n";
    	document.getElementById('mqttLog').scrollTop = document.getElementById('mqttLog').scrollHeight;
    }

    //Clear Console 
    $("#clearConsole").click(function () {
    	document.getElementById("mqttLog").value = document.getElementById("mqttLog").defaultValue;
    });
});