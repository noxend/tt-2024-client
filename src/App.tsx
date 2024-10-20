import { Reorder } from "framer-motion";
import { graphql } from "./gql";
import { useSuspenseQuery, useMutation } from "@apollo/client";
import { Button, Card, CardBody } from "@nextui-org/react";

const ITEMS = graphql(`
  query OrderItems {
    orderItems {
      id
      position
      label
      color
    }
  }
`);

const UPDATE_ORDER_ITEM_POSITION = graphql(`
  mutation UpdateOrderItemPosition($id: String!, $newPosition: Float!) {
    updateOrderItemPosition(id: $id, newPosition: $newPosition) {
      id
      position
      label
    }
  }
`);

const RESET_ORDER_ITEMS = graphql(`
  mutation ResetOrderItems {
    resetOrderItems
  }
`);

function App() {
  const { data, client } = useSuspenseQuery(ITEMS);

  const [updateOrderItemPosition] = useMutation(UPDATE_ORDER_ITEM_POSITION);

  const [resetOrderItems, { loading }] = useMutation(RESET_ORDER_ITEMS, {
    refetchQueries: [ITEMS],
    awaitRefetchQueries: true,
  });

  const items = data.orderItems;

  const handleReorder = async (newItems: typeof items) => {
    client.writeQuery({
      data: { orderItems: newItems },
      query: ITEMS,
    });
  };

  // console.log(JSON.stringify(items, null, 2));

  const handleDragEnd = async (item: (typeof items)[number], index: number) => {
    const nextItem = items[index + 1];
    const prevItem = items[index - 1];
    const currentItem = items[index];

    let newPosition = currentItem.position;

    if (nextItem && prevItem) {
      newPosition = (nextItem.position + prevItem.position) / 2;
    }

    if (nextItem && !prevItem) {
      newPosition = nextItem.position / 2;
    }

    if (prevItem && !nextItem) {
      newPosition = prevItem.position + 16384;
    }

    if (newPosition === currentItem.position) {
      return;
    }

    if (newPosition <= 0.1) {
      const newItems = items.map((item, index) => {
        return {
          ...item,
          position: (index + 1) * 16384,
        };
      });

      handleReorder(newItems);
    }

    updateOrderItemPosition({
      variables: {
        newPosition,
        id: item.id,
      },
    });
  };

  return (
    <div>
      <div>
        <Button
          color="primary"
          onClick={() => resetOrderItems()}
          isLoading={loading}
        >
          Reset
        </Button>
      </div>
      <Reorder.Group
        className="space-y-4 min-w-[400px] mx-auto w-full"
        onReorder={handleReorder}
        values={items}
        axis="y"
      >
        {data.orderItems.map((item, index) => (
          <Reorder.Item
            onDragEnd={() => handleDragEnd(item, index)}
            key={item.label}
            value={item}
          >
            <Card
              className="cursor-grab text-black"
              style={{
                backgroundColor: item.color,
              }}
            >
              <CardBody>
                <p className="text-center font-semibold">
                  {item.label} ({item.position})
                </p>
              </CardBody>
            </Card>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}

export default App;
