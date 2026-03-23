import requests

# res = requests.post('http://localhost:3001/api/tasks',
#                     json={
#                         'data':
#                         {'tasks': 
#                         [
#                             {'id':2,
#                             'status':'success',
#                             'message':'task 1 completed successfully'
#                             }
#                         ]
#                         }
#                         }
#                     )

get = requests.get('http://localhost:3001/api/tasks')
data = get.json()
print(data)