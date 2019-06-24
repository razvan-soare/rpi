import serial

start_auto_read = [0xBB, 0x00, 0x27, 0x00, 0x03, 0x22, 0x00, 0x64]
get_reader_info = [0xBB, 0x00, 0x03, 0x00, 0x01, 0x02, 0x7E]
New_comm = [0x7C, 0xFF, 0xFF, 0x11, 0x32, 0x00, 0x43]
AutoRead2 = [0xBB, 0x00, 0x36, 0x00, 0x05, 0x02, 0x00, 0x00, 0x00, 0x64, 0x7E]

setAntenna = [0xA0, 0x04, 0x01, 0x74, 0x00, 0xE7]
trial2 = [0xA0, 0x04, 0x01, 0x89, 0x64, 0x6E]
trial3 = [0xA0, 0x04, 0x01, 0x89, 0x32, 0xA0]
Read = [0xA0, 0x06, 0x01, 0x81, 0x01, 0x01, 0x02, 0x2]


# conn = serial.Serial('COM7', 115200, timeout=3, bytesize=8, parity='N', stopbits=1, rtscts=0)
conn = serial.Serial('COM3', 9600, timeout=3, bytesize=8, parity='N', stopbits=1, rtscts=0)

if conn.is_open:
    print("### Connection is open ###")
          
       
# conn.write(bytearray(message))
# ser_reply = conn.read(8)

# if ser_reply:
#     print("# Set register succesfully", ser_reply)
          
# conn.write(bytearray(trial2))
# ser_reply = conn.read(12)

# if ser_reply:
#     print("# Set register succesfully", ser_reply)
          
# conn.write(bytearray(trial2))
# ser_reply = conn.read(12)

# if ser_reply:
#     print("# Set register succesfully", ser_reply)
  
# conn.write(bytearray(trial2))
# ser_reply = conn.read(12)

# if ser_reply:
#     print("# Set register succesfully", ser_reply)
        
# conn.write(bytearray(trial3))
# ser_reply = conn.read(21)

# if ser_reply:
#     print("# Set register succesfully", ser_reply)
          
conn.close()