import { Reorder } from "framer-motion";
import { graphql } from "./gql";
import { useSuspenseQuery, useMutation } from "@apollo/client";
import { Button } from "@nextui-org/react";

const ITEMS = graphql(`
  query OrderItems {
    orderItems {
      id
      position
      label
      color
      fgColor
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

const THRESHOLD = 0.1;
const STEP = 16_384;

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

  const recalculatePositions = () => {
    const newItems = items.map((item, index) => {
      return {
        ...item,
        position: (index + 1) * 16384,
      };
    });

    handleReorder(newItems);
  };

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
      newPosition = prevItem.position + STEP;
    }

    if (newPosition === currentItem.position) {
      return;
    }

    if (
      (nextItem && Math.abs(newPosition - nextItem.position) <= THRESHOLD) ||
      (prevItem && Math.abs(newPosition - prevItem.position) <= THRESHOLD) ||
      newPosition === currentItem.position
    ) {
      recalculatePositions();
      console.log("Recalculating positions");
    }

    updateOrderItemPosition({
      variables: {
        newPosition,
        id: item.id,
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button onClick={() => resetOrderItems()} isLoading={loading}>
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
            <div
              className="cursor-grab px-4 py-8 rounded-xl shadow-md"
              style={{
                backgroundColor: item.color,
                color: item.fgColor,
              }}
            >
              <p className="text-center font-semibold">
                {item.label} ({item.position})
              </p>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}

export default App;
